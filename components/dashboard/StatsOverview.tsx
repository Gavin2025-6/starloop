"use client";

import { useTranslations } from "next-intl";
import { Star, TrendingUp, Send, MessageCircle } from "lucide-react";

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
      Icon: Star,
    },
    {
      label: t("averageRating"),
      value: stats.averageRating,
      trend: "+0.2",
      trendUp: true,
      Icon: TrendingUp,
    },
    {
      label: t("pendingRequests"),
      value: stats.pendingRequests,
      trend: "Active",
      trendUp: true,
      Icon: Send,
    },
    {
      label: t("recentActivity"),
      value: stats.needsReply,
      trend: "Reply now",
      trendUp: stats.needsReply === 0,
      Icon: MessageCircle,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-[#E5E7EB] rounded-xl p-6"
        >
          <div className="w-8 h-8 bg-[#F3F4F6] rounded-lg flex items-center justify-center mb-4">
            <card.Icon size={16} color="#6B7280" />
          </div>
          <div className="text-3xl font-bold" style={{ color: "#0D1117" }}>
            {card.value}
          </div>
          <div className="text-sm mt-1" style={{ color: "#6B7280" }}>{card.label}</div>
          <div className="mt-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full inline-block"
              style={
                card.trendUp
                  ? { color: "#10B981", background: "#F0FDF4" }
                  : { color: "#EF4444", background: "#FEF2F2" }
              }
            >
              {card.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
