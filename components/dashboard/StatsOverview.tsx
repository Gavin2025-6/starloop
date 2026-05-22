"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Star, TrendingUp, Send, MessageCircle } from "lucide-react";

function useCountUp(target: number, duration = 800, decimals = 0) {
  const [value, setValue] = useState(0);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    if (target === prevTargetRef.current && value !== 0) return;
    prevTargetRef.current = target;

    let frame: number;
    const startTime = performance.now();

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(update);
      }
    }

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  if (decimals > 0) return parseFloat(value.toFixed(decimals));
  return Math.round(value);
}

interface Stats {
  totalReviews: number;
  averageRating: string;
  pendingRequests: number;
  needsReply: number;
}

export default function StatsOverview({ stats }: { stats: Stats }) {
  const t = useTranslations("dashboard");

  const hasValidRating = stats.averageRating !== "—";
  const ratingTarget = hasValidRating ? parseFloat(stats.averageRating) : 0;

  const animatedTotal = useCountUp(stats.totalReviews, 800, 0);
  const animatedRating = useCountUp(ratingTarget, 800, 1);
  const animatedPending = useCountUp(stats.pendingRequests, 800, 0);
  const animatedNeedsReply = useCountUp(stats.needsReply, 800, 0);

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
      {cards.map((card, index) => {
        const animatedValues = [
          animatedTotal,
          hasValidRating ? animatedRating : stats.averageRating,
          animatedPending,
          animatedNeedsReply,
        ];
        const displayValue = animatedValues[index] ?? card.value;

        return (
          <div
            key={card.label}
            className="bg-white border border-[#E5E7EB] rounded-xl p-6"
          >
            <div className="w-8 h-8 bg-[#F3F4F6] rounded-lg flex items-center justify-center mb-4">
              <card.Icon size={16} color="#6B7280" />
            </div>
            <div className="text-3xl font-bold" style={{ color: "#0D1117" }}>
              {displayValue}
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
        );
      })}
    </div>
  );
}
