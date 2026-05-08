"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import StarRating from "./StarRating";
import Badge from "../ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

interface Review {
  id: string;
  reviewerName?: string | null;
  rating: number;
  content?: string | null;
  publishedAt: Date;
  isReplied: boolean;
  isNegative: boolean;
  aiDraftReply?: string | null;
  replyContent?: string | null;
}

interface ReviewCardProps {
  review: Review;
  businessId: string;
}

export default function ReviewCard({ review, businessId }: ReviewCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [draft, setDraft] = useState(review.aiDraftReply ?? "");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(review.isReplied);
  const [expanded, setExpanded] = useState(false);

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
    <div
      className={`bg-white rounded-2xl border p-4 ${
        review.isNegative ? "border-red-100" : "border-gray-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-gray-900 text-sm">
            {review.reviewerName ?? "Anonymous"}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-gray-400">
              {formatRelativeTime(review.publishedAt, locale)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {review.isNegative && (
            <Badge variant="error">{t("reviews.negative")}</Badge>
          )}
          {published && (
            <Badge variant="success">Replied</Badge>
          )}
        </div>
      </div>

      {/* Review content */}
      {review.content && (
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {review.content}
        </p>
      )}

      {/* AI reply section */}
      {!published && (
        <div className="border-t border-gray-50 pt-3">
          {!expanded && !draft && (
            <button
              onClick={handleGenerateReply}
              disabled={generating}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {generating
                ? t("reviews.generatingReply")
                : `✨ ${t("reviews.generateReply")}`}
            </button>
          )}

          {(draft || expanded) && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("reviews.replyDraft")}
              </label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Edit reply before publishing..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handlePublishReply}
                  disabled={publishing || !draft}
                  className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {publishing ? t("common.loading") : t("reviews.publishReply")}
                </button>
                <button
                  onClick={handleGenerateReply}
                  disabled={generating}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  {generating ? "..." : "↻ Regenerate"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {published && review.replyContent && (
        <div className="border-t border-gray-50 pt-3">
          <p className="text-xs font-medium text-gray-400 mb-1">Your reply:</p>
          <p className="text-sm text-gray-600 italic">{review.replyContent}</p>
        </div>
      )}
    </div>
  );
}
