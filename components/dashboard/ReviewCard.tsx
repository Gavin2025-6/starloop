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

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)" }}
    >
      {initial}
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
  const isPositive = review.rating >= 4;
  const reviewerName = review.reviewerName ?? "Anonymous";

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

  // Determine card accent bar color
  const accentColor = isPrivate ? "#6366F1" : isPositive ? "#10B981" : "#EF4444";
  const cardBg = isPrivate ? "#F5F3FF" : review.isNegative ? "#FFF5F5" : "#F0FFF4";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: cardBg,
        border: `1px solid ${isPrivate ? "#C4B5FD" : review.isNegative ? "#FECACA" : "#A7F3D0"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        display: "flex",
      }}
    >
      {/* Left accent bar */}
      <div className="w-1 flex-shrink-0" style={{ background: accentColor }} />

      <div className="flex-1 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <Avatar name={reviewerName} />
            <div>
              <div className="font-semibold text-sm" style={{ color: "#1A1D23" }}>
                {reviewerName}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StarDisplay rating={review.rating} size={14} />
                <span className="text-xs" style={{ color: "#6B7280" }}>
                  {formatRelativeTime(review.publishedAt, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap justify-end">
            {isPrivate && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}
              >
                Private
              </span>
            )}
            {!isPrivate && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(74,111,255,0.1)", color: "#4A6FFF" }}
              >
                Google
              </span>
            )}
            {review.isNegative && !isPrivate && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(255,71,87,0.1)", color: "#FF4757" }}
              >
                {t("reviews.negative")}
              </span>
            )}
            {published && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(0,201,167,0.1)", color: "#00C9A7" }}
              >
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
                className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "linear-gradient(135deg, #6366F1, #4A6FFF)", color: "#fff", border: "none", cursor: "pointer" }}
              >
                ✉️ Contact Customer
              </button>
            </div>
          </div>
        )}

        {/* Google review: AI reply flow */}
        {!isPrivate && !published && (
          <div className="pt-3" style={{ borderTop: "1px solid #F0F0F5" }}>
            {!expanded && !draft && (
              <button
                onClick={handleGenerateReply}
                disabled={generating}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
                  color: "#fff",
                  border: "none",
                  cursor: generating ? "not-allowed" : "pointer",
                }}
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
                  className="w-full text-sm px-3 py-2 resize-none"
                  style={{
                    border: "1px solid #E8ECEF",
                    borderRadius: "8px",
                    outline: "none",
                    color: "#1A1D23",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="Edit reply before publishing..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePublishReply}
                    disabled={publishing || !draft}
                    className="text-sm font-medium px-4 py-1.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
                      color: "#fff",
                      border: "none",
                      cursor: publishing || !draft ? "not-allowed" : "pointer",
                    }}
                  >
                    {publishing ? t("common.loading") : t("reviews.publishReply")}
                  </button>
                  <button
                    onClick={handleGenerateReply}
                    disabled={generating}
                    className="text-sm disabled:opacity-50"
                    style={{ color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {generating ? "..." : "↻ Regenerate"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!isPrivate && published && review.replyContent && (
          <div className="pt-3" style={{ borderTop: "1px solid #F0F0F5" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#6B7280" }}>Your reply:</p>
            <p className="text-sm italic" style={{ color: "#374151" }}>{review.replyContent}</p>
          </div>
        )}
      </div>
    </div>
  );
}
