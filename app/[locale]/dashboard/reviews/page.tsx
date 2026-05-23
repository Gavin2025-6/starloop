"use client";

import { useState, useEffect, useCallback } from "react";

interface Review {
  id: string;
  reviewerName: string | null;
  rating: number;
  content: string | null;
  publishedAt: string;
  isReplied: boolean;
  replyContent: string | null;
  aiDraftReply: string | null;
  isNegative: boolean;
  source: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  platform: string;
  businessId: string;
  taskStatus: string;
  resolvedAt: string | null;
  archivedAt: string | null;
}

type Tab = "tasks" | "positive" | "private" | "all";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  new:         { label: "New",  color: "#DC2626", bg: "#FEF2F2" },
  in_progress: { label: "In progress",  color: "#D97706", bg: "#FFFBEB" },
  resolved:    { label: "Resolved",  color: "#059669", bg: "#F0FDF4" },
  archived:    { label: "Archived",  color: "#6B7280", bg: "#F9FAFB" },
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map((s) => (
        <span key={s} style={{ color: s <= rating ? "#F59E0B" : "#E5E7EB", fontSize: "14px" }}>★</span>
      ))}
    </span>
  );
}

function ReviewTaskCard({
  review,
  onStatusChange,
}: {
  review: Review;
  onStatusChange: (id: string, status: string, newDraft?: string) => void;
}) {
  const [draft, setDraft] = useState(review.aiDraftReply ?? "");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [generating, setGenerating] = useState(false);

  const isNeg = review.isNegative || review.rating <= 3;
  const isPrivate = review.source === "PRIVATE";
  const status = review.taskStatus ?? "new";

  const accentColor = isPrivate || isNeg ? "#EF4444" : "#10B981";
  const borderColor = isPrivate || isNeg ? "#FECACA" : "#A7F3D0";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  async function generateDraft() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, language: "en" }),
      });
      const data = await res.json();
      if (data.reply) {
        setDraft(data.reply);
        onStatusChange(review.id, status, data.reply);
      }
    } catch {
      // ignore
    }
    setGenerating(false);
  }

  async function sendDraft() {
    setLoading("send");
    try {
      // Publish reply
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyContent: draft }),
      });
      if (res.ok) {
        // Mark in_progress
        await fetch(`/api/reviews/${review.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskStatus: "in_progress" }),
        });
        onStatusChange(review.id, "in_progress");
        showToast("Handled. Consistent recovery work can improve ratings over time.");
      }
    } catch {
      showToast("Send failed. Please try again.");
    }
    setLoading(null);
    setEditing(false);
  }

  async function publishReply() {
    setLoading("publish");
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyContent: draft }),
      });
      if (res.ok) {
        await fetch(`/api/reviews/${review.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskStatus: "resolved" }),
        });
        onStatusChange(review.id, "resolved");
        showToast("Handled. Consistent recovery work can improve ratings over time.");
      }
    } catch {
      showToast("Publish failed. Please try again.");
    }
    setLoading(null);
    setEditing(false);
  }

  async function markResolved() {
    setLoading("resolve");
    await fetch(`/api/reviews/${review.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskStatus: "resolved" }),
    });
    onStatusChange(review.id, "resolved");
    showToast("Handled. Consistent recovery work can improve ratings over time.");
    setLoading(null);
  }

  const statusInfo = STATUS_LABEL[status] ?? STATUS_LABEL.new;

  return (
    <div style={{
      display: "flex",
      borderRadius: "12px",
      overflow: "hidden",
      border: `1px solid ${borderColor}`,
      marginBottom: "12px",
      background: "#FFFFFF",
    }}>
      {/* Left accent bar */}
      <div style={{ width: "3px", background: accentColor, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: "20px" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            {/* Avatar */}
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "#F3F4F6", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "0.875rem", fontWeight: 600,
              color: "#6B7280", flexShrink: 0,
            }}>
              {(review.reviewerName ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0D1117" }}>
                {review.reviewerName ?? "Anonymous"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <StarRow rating={review.rating} />
                <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                  {new Date(review.publishedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {isPrivate && (
              <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: "9999px", background: "#EEF2FF", color: "#6366F1", fontWeight: 500 }}>Private</span>
            )}
            {isNeg && !isPrivate && (
              <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: "9999px", background: "#FEF2F2", color: "#EF4444", fontWeight: 500 }}>Negative</span>
            )}
            {!isNeg && !isPrivate && (
              <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: "9999px", background: "#EFF6FF", color: "#3B82F6", fontWeight: 500 }}>Google</span>
            )}
            <span style={{
              fontSize: "0.75rem", padding: "3px 10px", borderRadius: "9999px",
              background: statusInfo.bg, color: statusInfo.color, fontWeight: 500,
            }}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Content */}
        {review.content && (
          <p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.6, marginBottom: "16px", marginTop: 0 }}>
            {review.content}
          </p>
        )}

        {/* Contact info (private feedback) */}
        {isPrivate && (review.contactPhone || review.contactEmail) && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {review.contactPhone && (
              <span style={{ fontSize: "0.8125rem", fontWeight: 500, padding: "6px 12px", borderRadius: "8px", background: "rgba(99,102,241,0.08)", color: "#4F46E5", border: "1px solid rgba(99,102,241,0.2)" }}>
                📱 {review.contactPhone}
              </span>
            )}
            {review.contactEmail && (
              <span style={{ fontSize: "0.8125rem", fontWeight: 500, padding: "6px 12px", borderRadius: "8px", background: "rgba(99,102,241,0.08)", color: "#4F46E5", border: "1px solid rgba(99,102,241,0.2)" }}>
                📧 {review.contactEmail}
              </span>
            )}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{ fontSize: "0.8125rem", padding: "10px 14px", borderRadius: "8px", background: "#F0FDF4", color: "#059669", border: "1px solid #A7F3D0", marginBottom: "12px" }}>
            {toast}
          </div>
        )}

        {/* Resolved/Archived — just show reply if any */}
        {(status === "resolved" || status === "archived") && review.replyContent && (
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "12px", marginTop: "4px" }}>
            <p style={{ fontSize: "0.75rem", color: "#6B7280", marginBottom: "4px", fontWeight: 500 }}>Your reply:</p>
            <p style={{ fontSize: "0.875rem", color: "#374151", fontStyle: "italic", margin: 0 }}>{review.replyContent}</p>
          </div>
        )}

        {/* Action area for active tasks */}
        {status !== "resolved" && status !== "archived" && (
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px", marginTop: "4px" }}>

            {/* AI draft area */}
            {(draft || editing) ? (
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  AI plan
                </label>
                {editing ? (
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%", border: "1px solid #E5E7EB", borderRadius: "8px",
                      padding: "10px", fontSize: "0.875rem", color: "#0D1117",
                      outline: "none", resize: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#0D1117"; e.target.style.boxShadow = "0 0 0 2px #0D1117"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                  />
                ) : (
                  <p style={{ fontSize: "0.875rem", color: "#374151", fontStyle: "italic", margin: 0, lineHeight: 1.6 }}>
                    &ldquo;{draft}&rdquo;
                  </p>
                )}
              </div>
            ) : null}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {/* Negative / Private reviews: 3 buttons */}
              {(isNeg || isPrivate) && (
                <>
                  {!draft ? (
                    <button
                      onClick={generateDraft}
                      disabled={generating}
                      style={{
                        padding: "8px 14px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 500,
                        background: "#0D1117", color: "#FFFFFF", border: "none", cursor: generating ? "not-allowed" : "pointer",
                        opacity: generating ? 0.6 : 1,
                      }}
                    >
                      {generating ? "Generating..." : "Generate AI plan"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={editing ? sendDraft : sendDraft}
                        disabled={loading === "send" || !draft}
                        style={{
                          padding: "8px 14px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 500,
                          background: "#0D1117", color: "#FFFFFF", border: "none", cursor: "pointer",
                          opacity: (loading === "send" || !draft) ? 0.5 : 1,
                        }}
                      >
                        {loading === "send" ? "Sending..." : "Send AI plan"}
                      </button>
                      <button
                        onClick={() => { setEditing(true); }}
                        disabled={loading !== null}
                        style={{
                          padding: "8px 14px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 500,
                          background: "transparent", color: "#0D1117", border: "1px solid #E5E7EB", cursor: "pointer",
                        }}
                      >
                        Edit before sending
                      </button>
                      {editing && (
                        <button
                          onClick={sendDraft}
                          disabled={loading === "send" || !draft}
                          style={{
                            padding: "8px 14px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 500,
                            background: "#059669", color: "#FFFFFF", border: "none", cursor: "pointer",
                          }}
                        >
                          Confirm send
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={markResolved}
                    disabled={loading === "resolve"}
                    style={{
                      padding: "8px 14px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 500,
                      background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", cursor: "pointer",
                      opacity: loading === "resolve" ? 0.5 : 1,
                    }}
                  >
                    {loading === "resolve" ? "Updating..." : "Mark handled"}
                  </button>
                </>
              )}

              {/* Positive Google reviews: 2 buttons */}
              {!isNeg && !isPrivate && (
                <>
                  {!draft ? (
                    <button
                      onClick={generateDraft}
                      disabled={generating}
                      style={{
                        padding: "8px 14px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 500,
                        background: "#0D1117", color: "#FFFFFF", border: "none", cursor: "pointer",
                        opacity: generating ? 0.6 : 1,
                      }}
                    >
                      {generating ? "Generating..." : "Generate AI reply"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={publishReply}
                        disabled={loading === "publish" || !draft}
                        style={{
                          padding: "8px 14px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 500,
                          background: "#0D1117", color: "#FFFFFF", border: "none", cursor: "pointer",
                          opacity: (loading === "publish" || !draft) ? 0.5 : 1,
                        }}
                      >
                        {loading === "publish" ? "Publishing..." : "Publish reply"}
                      </button>
                      <button
                        onClick={() => setEditing(!editing)}
                        style={{
                          padding: "8px 14px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 500,
                          background: "transparent", color: "#0D1117", border: "1px solid #E5E7EB", cursor: "pointer",
                        }}
                      >
                        {editing ? "Cancel edit" : "Edit"}
                      </button>
                      {editing && (
                        <button
                          onClick={publishReply}
                          disabled={loading === "publish" || !draft}
                          style={{
                            padding: "8px 14px", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 500,
                            background: "#059669", color: "#FFFFFF", border: "none", cursor: "pointer",
                          }}
                        >
                          Confirm publish
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Regenerate link */}
              {draft && (
                <button
                  onClick={generateDraft}
                  disabled={generating}
                  style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontSize: "0.8125rem", padding: "8px 4px" }}
                >
                  {generating ? "..." : "Regenerate"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  const loadReviews = useCallback(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  function handleStatusChange(id: string, newStatus: string, newDraft?: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              taskStatus: newStatus,
              aiDraftReply: newDraft !== undefined ? newDraft : r.aiDraftReply,
              resolvedAt: newStatus === "resolved" ? new Date().toISOString() : r.resolvedAt,
            }
          : r
      )
    );
  }

  // Stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const needsAction = reviews.filter((r) => (r.isNegative || r.source === "PRIVATE") && ["new", "in_progress"].includes(r.taskStatus ?? "new")).length;
  const doneThisWeek = reviews.filter((r) => r.taskStatus === "resolved" && r.resolvedAt && new Date(r.resolvedAt) >= weekAgo).length;
  const fiveStarThisWeek = reviews.filter((r) => r.rating === 5 && new Date(r.publishedAt) >= weekAgo).length;

  // Tabs
  const taskReviews = reviews.filter((r) => (r.isNegative || r.source === "PRIVATE") && r.taskStatus !== "archived");
  const positiveReviews = reviews.filter((r) => r.rating >= 4 && r.source !== "PRIVATE");
  const privateReviews = reviews.filter((r) => r.source === "PRIVATE");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "tasks",    label: "Recovery tasks",  count: taskReviews.filter(r => ["new","in_progress"].includes(r.taskStatus ?? "new")).length },
    { key: "positive", label: "Public praise",   count: positiveReviews.length },
    { key: "private",  label: "Private feedback", count: privateReviews.length },
    { key: "all",      label: "All signals",      count: reviews.length },
  ];

  const displayed =
    activeTab === "tasks"    ? taskReviews :
    activeTab === "positive" ? positiveReviews :
    activeTab === "private"  ? privateReviews :
    reviews;

  const businessId = reviews[0]?.businessId ?? "";

  return (
    <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0D1117", margin: 0 }}>Customer signals</h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "4px" }}>Recover unhappy customers, publish with care, and turn feedback into operating insight.</p>
      </div>

      {/* 3-number stats header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #FECACA", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#DC2626" }}>{needsAction}</div>
          <div style={{ fontSize: "0.8125rem", color: "#6B7280", marginTop: "4px" }}>Needs action</div>
          <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "2px" }}>Open recovery items</div>
        </div>
        <div style={{ background: "#FFFFFF", border: "1px solid #A7F3D0", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#059669" }}>{doneThisWeek}</div>
          <div style={{ fontSize: "0.8125rem", color: "#6B7280", marginTop: "4px" }}>Closed this week</div>
          <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "2px" }}>Resolved customer tasks</div>
        </div>
        <div style={{ background: "#FFFFFF", border: "1px solid #FDE68A", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#D97706" }}>{fiveStarThisWeek}</div>
          <div style={{ fontSize: "0.8125rem", color: "#6B7280", marginTop: "4px" }}>New promoters</div>
          <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "2px" }}>5-star signals this week</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", borderBottom: "1px solid #E5E7EB", paddingBottom: "0" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 16px",
              fontSize: "0.875rem",
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? "#0D1117" : "#6B7280",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #0D1117" : "2px solid transparent",
              marginBottom: "-1px",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {tab.label}
            <span style={{
              fontSize: "0.75rem", padding: "2px 7px", borderRadius: "9999px",
              background: activeTab === tab.key ? "#0D1117" : "#F3F4F6",
              color: activeTab === tab.key ? "#FFFFFF" : "#6B7280",
              fontWeight: 500,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>Loading...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>
            {activeTab === "tasks" ? "🎉" : "⭐"}
          </div>
          <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: 0 }}>
            {activeTab === "tasks" ? "No recovery tasks are open. Nice work." : "No reviews yet."}
          </p>
        </div>
      ) : (
        <div>
          {displayed.map((review) => (
            <ReviewTaskCard
              key={review.id}
              review={review}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
