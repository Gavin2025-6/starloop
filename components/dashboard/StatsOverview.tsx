"use client";

import { useTranslations } from "next-intl";

interface Stats {
  totalReviews: number;
  averageRating: string;
  pendingRequests: number;
  needsReply: number;
}

export default function StatsOverview({ stats }: { stats: Stats }) {
  const t = useTranslations("dashboard");

  const cards = [
    {
      label: t("totalReviews"),
      value: stats.totalReviews,
      trend: "+12%",
      trendUp: true,
      iconBg: "linear-gradient(135deg, #6C63FF, #4B8EF5)",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="white"/>
        </svg>
      ),
    },
    {
      label: t("averageRating"),
      value: stats.averageRating,
      trend: "+0.2",
      trendUp: true,
      iconBg: "linear-gradient(135deg, #F59E0B, #FBBF24)",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="white"/>
        </svg>
      ),
    },
    {
      label: t("pendingRequests"),
      value: stats.pendingRequests,
      trend: "Active",
      trendUp: true,
      iconBg: "linear-gradient(135deg, #4B8EF5, #60A5FA)",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="white"/>
        </svg>
      ),
    },
    {
      label: t("recentActivity"),
      value: stats.needsReply,
      trend: "Reply now",
      trendUp: stats.needsReply === 0,
      iconBg: "linear-gradient(135deg, #FF4757, #FF6B81)",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" fill="white"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl p-5"
          style={{
            border: "1px solid #E8ECEF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: card.iconBg }}
            >
              {card.icon}
            </div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: card.trendUp ? "rgba(0,201,167,0.1)" : "rgba(255,71,87,0.1)",
                color: card.trendUp ? "#00C9A7" : "#FF4757",
              }}
            >
              {card.trend}
            </span>
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>
            {card.value}
          </div>
          <div className="text-xs" style={{ color: "#6B7280" }}>{card.label}</div>
        </div>
      ))}
    </div>
  );
}
