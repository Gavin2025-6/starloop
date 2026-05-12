"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatRelativeTime } from "@/lib/utils";

interface Review {
  id: string;
  reviewerName?: string | null;
  rating: number;
  content?: string | null;
  publishedAt: Date | string;
  isReplied: boolean;
  isNegative: boolean;
  aiDraftReply?: string | null;
  replyContent?: string | null;
  source?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

interface ReviewCardProps {
  review: Review;
  businessId: string;
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize: `${size}px`,
            color: star <= rating ? "#F59E0B" : "#E5E7EB",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewCard({ review, businessId }: ReviewCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [draft, setDraft] = useState(review.aiDraftReply ?? "");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(review.isReplied);
  const [expanded, setExpanded] = useState(false);

  const isPrivate = review.source === "PRIVATE";
  const reviewerName = review.reviewerName ?? "Anonymous";
  const initial = reviewerName.charAt(0).toUpperCase();

  const accentColor = isPrivate ? "#6366F1" : review.isNegative ? "#EF4444" : "#10B981";
  const borderColor = isPrivate ? "#C4B5FD" : review.isNegative ? "#FECACA" : "#A7F3D0";

  async function handleGenerateReply() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, language: locale }),
      });
      const data = await res.json();
      setDraft(data.reply);
      setExpanded(true);
    } catch {
      alert(t("reviews.replyError"));
    }
    setGenerating(false);
  }

  async function handlePublishReply() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyContent: draft }),
      });
      if (res.ok) {
        setPublished(true);
        alert(t("reviews.replySuccess"));
      } else {
        alert(t("reviews.replyError"));
      }
    } catch {
      alert(t("reviews.replyError"));
    }
    setPublishing(false);
  }

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
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "#F3F4F6", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "0.875rem", fontWeight: 600,
              color: "#6B7280", flexShrink: 0,
            }}>
              {initial}
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: "#0D1117" }}>
                {reviewerName}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StarDisplay rating={review.rating} size={14} />
                <span className="text-xs" style={{ color: "#9CA3AF" }}>
                  {formatRelativeTime(review.publishedAt, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap justify-end">
            {isPrivate && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#EEF2FF", color: "#6366F1" }}>
                Private
              </span>
            )}
            {!isPrivate && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#EFF6FF", color: "#3B82F6" }}>
                Google
              </span>
            )}
            {review.isNegative && !isPrivate && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#FEF2F2", color: "#EF4444" }}>
                {t("reviews.negative")}
              </span>
            )}
            {published && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#F0FDF4", color: "#10B981" }}>
                Replied
              </span>
            )}
          </div>
        </div>

        {/* Review content */}
        {review.content && (
          <p
            className="text-sm leading-relaxed mb-4"
            style={{
              color: "#374151",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {review.content}
          </p>
        )}

        {/* Private feedback: contact info + contact button */}
        {isPrivate && (
          <div className="pt-3" style={{ borderTop: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="space-y-2">
              {(review.contactPhone || review.contactEmail) && (
                <div className="flex gap-2 flex-wrap">
                  {review.contactPhone && (
                    <span
                      className="text-sm font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(99,102,241,0.08)", color: "#4F46E5", border: "1px solid rgba(99,102,241,0.2)" }}
                    >
                      📱 {review.contactPhone}
                    </span>
                  )}
                  {review.contactEmail && (
                    <span
                      className="text-sm font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(99,102,241,0.08)", color: "#4F46E5", border: "1px solid rgba(99,102,241,0.2)" }}
                    >
                      📧 {review.contactEmail}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  if (review.contactEmail) {
                    window.location.href = `mailto:${review.contactEmail}?subject=Following up on your feedback&body=Hi ${review.reviewerName ?? "there"},%0A%0AThank you for sharing your feedback with us. We'd love to make things right.%0A%0ABest regards`;
                  } else if (review.contactPhone) {
                    alert(`Call or text: ${review.contactPhone}`);
                  } else {
                    alert("No contact info left by customer.");
                  }
                }}
                style={{
                  background: "linear-gradient(135deg, #6366F1, #4A6FFF)",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ✉️ Contact Customer
              </button>
            </div>
          </div>
        )}

        {/* Google review: AI reply flow */}
        {!isPrivate && !published && (
          <div className="pt-3" style={{ borderTop: "1px solid #E5E7EB" }}>
            {!expanded && !draft && (
              <button
                onClick={handleGenerateReply}
                disabled={generating}
                style={{
                  background: "#0D1117",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: generating ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                  opacity: generating ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!generating) e.currentTarget.style.background = "#1a1a1a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#0D1117"; }}
              >
                {generating ? t("reviews.generatingReply") : `✨ ${t("reviews.generateReply")}`}
              </button>
            )}

            {(draft || expanded) && (
              <div className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: "#6B7280" }}>
                  {t("reviews.replyDraft")}
                </label>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "0.875rem",
                    color: "#0D1117",
                    outline: "none",
                    resize: "none",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#0D1117"; e.target.style.boxShadow = "0 0 0 2px #0D1117"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                  placeholder="Edit reply before publishing..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePublishReply}
                    disabled={publishing || !draft}
                    style={{
                      background: "#0D1117",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: publishing || !draft ? "not-allowed" : "pointer",
                      transition: "background 0.15s",
                      opacity: publishing || !draft ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (!publishing && draft) e.currentTarget.style.background = "#1a1a1a"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#0D1117"; }}
                  >
                    {publishing ? t("common.loading") : t("reviews.publishReply")}
                  </button>
                  <button
                    onClick={handleGenerateReply}
                    disabled={generating}
                    style={{ color: "#6B7280", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", opacity: generating ? 0.5 : 1 }}
                  >
                    {generating ? "..." : "↻ Regenerate"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!isPrivate && published && review.replyContent && (
          <div className="pt-3" style={{ borderTop: "1px solid #E5E7EB" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#6B7280" }}>Your reply:</p>
            <p className="text-sm italic" style={{ color: "#374151" }}>{review.replyContent}</p>
          </div>
        )}
      </div>
    </div>
  );
}
