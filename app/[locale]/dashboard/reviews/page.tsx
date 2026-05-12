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
    { key: "all",        label: "All Reviews",     count: reviews.length },
    { key: "google",     label: "Google",          count: reviews.filter(r => r.source !== "PRIVATE").length },
    { key: "private",    label: "Private",         count: reviews.filter(r => r.source === "PRIVATE").length },
    { key: "needsReply", label: "Needs Reply",     count: reviews.filter(r => !r.isReplied && r.source !== "PRIVATE").length },
    { key: "attention",  label: "Needs Attention", count: reviews.filter(r => r.isNegative).length },
  ];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>
          {t("reviews.title")}
        </h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>Manage and reply to your customer reviews</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
            style={{
              borderRadius: "10px",
              border: activeTab === tab.key ? "none" : "1px solid #E8ECEF",
              background: activeTab === tab.key ? "linear-gradient(135deg, #6C63FF, #4B8EF5)" : "#fff",
              color: activeTab === tab.key ? "#fff" : "#6B7280",
              cursor: "pointer",
            }}
          >
            {tab.label}
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "#F0F0F5",
                color: activeTab === tab.key ? "#fff" : "#6B7280",
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ border: "1px solid #E8ECEF" }}
        >
          <p className="text-sm" style={{ color: "#6B7280" }}>{t("common.loading")}</p>
        </div>
      ) : filtered.length > 0 ? (
        <ReviewList reviews={filtered} businessId={businessId} />
      ) : (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.1), rgba(75,142,245,0.1))" }}
          >
            ⭐
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>{t("reviews.noReviews")}</p>
        </div>
      )}
    </div>
  );
}
