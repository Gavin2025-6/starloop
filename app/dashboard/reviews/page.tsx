"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Review {
  id: string;
  platform: string;
  rating: number;
  content: string | null;
  authorName: string | null;
  aiReply: string | null;
  isReplied: boolean;
  reviewDate: string;
  createdAt: string;
}

interface BizData {
  name: string;
  googleConnection?: { reviewUrl: string | null; locationId: string | null } | null;
}

type FilterTab = "all" | "unreplied" | "5star" | "4star" | "3andbelow";

const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: "all",        label: "All" },
  { key: "unreplied",  label: "Needs Reply" },
  { key: "5star",      label: "5 Star" },
  { key: "4star",      label: "4 Star" },
  { key: "3andbelow",  label: "3 Star & Below" },
];

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 16 16" fill={i <= rating ? "#FBBF24" : "#E5E7EB"}>
          <path d="M8 1l1.85 3.75L14 5.45l-3 2.92.71 4.13L8 10.35l-3.71 2.15L5 8.37 2 5.45l4.15-.7L8 1z"/>
        </svg>
      ))}
    </span>
  );
}

function avatarColor(name: string | null) {
  const colors = ["bg-blue-100 text-blue-700","bg-green-100 text-green-700","bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700","bg-pink-100 text-pink-700","bg-teal-100 text-teal-700"];
  const i = (name?.charCodeAt(0) ?? 0) % colors.length;
  return colors[i];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

const CARD_SHADOW = "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]";

function ReviewCard({ review, onReplied }: { review: Review; onReplied: (id: string, text: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [aiState, setAiState] = useState<"idle" | "generating" | "preview">("idle");
  const [replyDraft, setReplyDraft] = useState(review.aiReply ?? "");
  const [sending, setSending] = useState(false);
  const [showWrite, setShowWrite] = useState(false);
  const [ownReply, setOwnReply] = useState("");

  const content = review.content ?? "";
  const truncated = content.length > 200 && !expanded;
  const displayText = truncated ? content.slice(0, 200) + "…" : content;

  async function generateAI() {
    setAiState("generating");
    const res = await fetch(`/api/reviews/${review.id}/reply`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    }).catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      setReplyDraft(d.reply ?? "");
      setAiState("preview");
    } else {
      setAiState("idle");
    }
  }

  async function sendReply(text: string) {
    setSending(true);
    await fetch(`/api/reviews/${review.id}/reply`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", replyText: text }),
    }).catch(() => {});
    onReplied(review.id, text);
    setSending(false);
    setAiState("idle");
    setShowWrite(false);
  }

  return (
    <div className={`bg-white rounded-xl p-5 ${CARD_SHADOW}`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(review.authorName)}`}>
          {(review.authorName ?? "?")[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="font-semibold text-[#0D1117] text-sm">{review.authorName ?? "Anonymous"}</span>
            <Stars rating={review.rating} />
            <span className="text-xs text-gray-400 ml-auto">{timeAgo(review.reviewDate)}</span>
          </div>

          {content && (
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              {displayText}
              {content.length > 200 && (
                <button onClick={() => setExpanded(e => !e)} className="text-[#4A6FFF] ml-1 text-xs hover:underline">
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </p>
          )}

          {/* Reply section */}
          {review.isReplied ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-gray-400 mb-1 font-medium">Replied {timeAgo(review.reviewDate)}</p>
              <p className="text-sm text-gray-600">{review.aiReply}</p>
            </div>
          ) : (
            <div className="mt-3">
              {aiState === "idle" && !showWrite && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={generateAI}
                    className="text-xs bg-[#0D1117] text-white px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors"
                  >
                    ✨ AI Reply
                  </button>
                  <button
                    onClick={() => setShowWrite(true)}
                    className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    Write My Own
                  </button>
                </div>
              )}

              {aiState === "generating" && (
                <p className="text-xs text-gray-400 animate-pulse">Generating reply…</p>
              )}

              {aiState === "preview" && (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={replyDraft}
                    onChange={e => setReplyDraft(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => sendReply(replyDraft)} disabled={sending}
                      className="text-xs bg-[#16A34A] text-white px-3 py-1.5 rounded-lg hover:bg-[#15803D] disabled:opacity-60">
                      {sending ? "Sending…" : "Send Reply"}
                    </button>
                    <button onClick={generateAI}
                      className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                      Regenerate
                    </button>
                    <button onClick={() => setAiState("idle")}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showWrite && (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={ownReply}
                    onChange={e => setOwnReply(e.target.value)}
                    placeholder="Write your reply…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => sendReply(ownReply)} disabled={sending || !ownReply.trim()}
                      className="text-xs bg-[#16A34A] text-white px-3 py-1.5 rounded-lg hover:bg-[#15803D] disabled:opacity-60">
                      {sending ? "Sending…" : "Send Reply"}
                    </button>
                    <button onClick={() => setShowWrite(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewsContent() {
  const searchParams = useSearchParams();
  const initFilter = (searchParams.get("filter") as FilterTab) ?? "all";

  const [biz, setBiz]         = useState<BizData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>(initFilter);
  const [autoAfterComplete, setAutoAfterComplete] = useState(true);
  const [autoAfterPayment,  setAutoAfterPayment]  = useState(true);
  const [sendTiming, setSendTiming] = useState("immediately");

  useEffect(() => {
    Promise.all([
      fetch("/api/business/profile").then(r => r.json()).catch(() => null),
      fetch("/api/reputation/check").then(r => r.json()).catch(() => []),
    ]).then(([b, r]) => {
      setBiz(b);
      setReviews(Array.isArray(r) ? r : []);
      setLoading(false);
    });
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const thisMonth = reviews.filter(r => {
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const replyRate = reviews.length
    ? Math.round((reviews.filter(r => r.isReplied).length / reviews.length) * 100)
    : 0;

  const filteredReviews = useMemo(() => {
    switch (activeTab) {
      case "unreplied":  return reviews.filter(r => !r.isReplied);
      case "5star":      return reviews.filter(r => r.rating === 5);
      case "4star":      return reviews.filter(r => r.rating === 4);
      case "3andbelow":  return reviews.filter(r => r.rating <= 3);
      default:           return reviews;
    }
  }, [reviews, activeTab]);

  function markReplied(id: string, text: string) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isReplied: true, aiReply: text } : r));
  }

  const bizName = biz?.name ?? "your business";
  const googleConnected = !!biz?.googleConnection;

  const STAT_CARDS = [
    { label: "Average Rating", value: avgRating, icon: "⭐" },
    { label: "Total Reviews",  value: String(reviews.length), icon: "📝" },
    { label: "This Month",     value: `+${thisMonth}`, icon: "📅" },
    { label: "Reply Rate",     value: `${replyRate}%`, icon: "💬" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-5">

        <h1 className="text-2xl font-bold text-[#0D1117]">Reviews</h1>

        {/* Google Connection Banner */}
        {!googleConnected ? (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-[#B45309] font-medium">
              Connect Google Business Profile to see and reply to your reviews
            </p>
            <a
              href="/api/google/connect"
              className="flex items-center gap-2 bg-[#0D1117] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#374151] transition-colors shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect Google Business Profile
            </a>
          </div>
        ) : (
          <div className="bg-[#F0FDF4] border border-green-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="text-green-600 text-lg">✓</span>
            <div>
              <span className="text-sm font-semibold text-[#15803D]">Connected: {bizName}</span>
              <span className="text-xs text-green-600 ml-3">Last synced 5 min ago</span>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map(s => (
            <div key={s.label} className={`bg-white rounded-xl p-4 text-center ${CARD_SHADOW}`}>
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-xl font-bold text-[#0D1117]">{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab.key
                  ? "font-bold text-[#0D1117] border-b-2 border-[#0D1117] -mb-px"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Review cards */}
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-10">Loading reviews…</p>
        ) : filteredReviews.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">No reviews match this filter.</p>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map(r => (
              <ReviewCard key={r.id} review={r} onReplied={markReplied} />
            ))}
          </div>
        )}

        {/* Auto-Request Settings */}
        <div className={`bg-white rounded-xl p-6 ${CARD_SHADOW}`}>
          <h2 className="text-base font-bold text-[#0D1117] mb-4">Auto-Request Settings</h2>
          <p className="text-sm text-gray-500 mb-4">Automatically ask customers for a Google review:</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">After job marked complete</span>
              <button
                onClick={() => setAutoAfterComplete(a => !a)}
                style={{
                  position: "relative", width: 44, height: 24, borderRadius: 12,
                  backgroundColor: autoAfterComplete ? "#16A34A" : "#D1D5DB",
                  border: "none", cursor: "pointer", transition: "background-color 0.2s ease",
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
                  backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s ease",
                  left: autoAfterComplete ? 22 : 2,
                }} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">After payment received</span>
              <button
                onClick={() => setAutoAfterPayment(a => !a)}
                style={{
                  position: "relative", width: 44, height: 24, borderRadius: 12,
                  backgroundColor: autoAfterPayment ? "#16A34A" : "#D1D5DB",
                  border: "none", cursor: "pointer", transition: "background-color 0.2s ease",
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
                  backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s ease",
                  left: autoAfterPayment ? 22 : 2,
                }} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">Timing</span>
              <select
                value={sendTiming}
                onChange={e => setSendTiming(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-white"
              >
                <option value="immediately">Immediately</option>
                <option value="1h">1 hour later</option>
                <option value="nextday">Next day</option>
              </select>
            </div>

            {/* SMS preview mockup */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview SMS</p>
              <div className="bg-gray-100 rounded-2xl p-4 max-w-xs mx-auto">
                <div className="bg-white rounded-xl p-3 text-xs text-gray-700 shadow-sm leading-relaxed">
                  Hi [Name]! Thanks for choosing {bizName}.{" "}
                  We&apos;d love your feedback — it takes 30 seconds:{" "}
                  <span className="text-[#4A6FFF]">[Google Review Link]</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Loading…</div>}>
      <ReviewsContent />
    </Suspense>
  );
}
