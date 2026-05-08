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
    { label: t("totalReviews"),    value: stats.totalReviews,    icon: "⭐", color: "text-yellow-500" },
    { label: t("averageRating"),   value: stats.averageRating,   icon: "📊", color: "text-blue-500" },
    { label: t("pendingRequests"), value: stats.pendingRequests, icon: "📨", color: "text-purple-500" },
    { label: t("recentActivity"),  value: stats.needsReply,      icon: "💬", color: "text-green-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-gray-100 p-4"
        >
          <div className={`text-2xl mb-1 ${card.color}`}>{card.icon}</div>
          <div className="text-2xl font-bold text-gray-900">{card.value}</div>
          <div className="text-xs text-gray-500 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
