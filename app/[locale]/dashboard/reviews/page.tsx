"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import ReviewList from "@/components/dashboard/ReviewList";

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
}

type Tab = "all" | "google" | "private" | "needsReply" | "attention";

export default function ReviewsPage() {
  const t = useTranslations();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        const list: Review[] = data.reviews ?? [];
        setReviews(list);
        if (list.length > 0) setBusinessId(list[0].businessId);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = reviews.filter((r) => {
    if (activeTab === "google")     return r.source !== "PRIVATE";
    if (activeTab === "private")    return r.source === "PRIVATE";
    if (activeTab === "needsReply") return !r.isReplied && r.source !== "PRIVATE";
    if (activeTab === "attention")  return r.isNegative;
    return true;
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all",        label: "All Reviews",       count: reviews.length },
    { key: "google",     label: "Google Reviews",     count: reviews.filter(r => r.source !== "PRIVATE").length },
    { key: "private",    label: "Private Feedback",   count: reviews.filter(r => r.source === "PRIVATE").length },
    { key: "needsReply", label: "Needs Reply",        count: reviews.filter(r => !r.isReplied && r.source !== "PRIVATE").length },
    { key: "attention",  label: "Needs Attention",    count: reviews.filter(r => r.isNegative).length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("reviews.title")}
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">{t("common.loading")}</p>
        </div>
      ) : filtered.length > 0 ? (
        <ReviewList reviews={filtered} businessId={businessId} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">⭐</div>
          <p className="text-gray-500 text-sm">{t("reviews.noReviews")}</p>
        </div>
      )}
    </div>
  );
}
