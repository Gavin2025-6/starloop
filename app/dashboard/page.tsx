"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Stats {
  todayJobs: number;
  callsAnswered7d: number;
  invoicedUnpaid: number;
  reviewsRequested30d: number;
  thisMonthRecovered: number;
  thisMonthRevenue: number;
  pendingRecovery: number;
  totalCustomers: number;
}

interface Job {
  id: string; status: string; scheduledAt: string | null;
  completedAt: string | null; createdAt: string; total: number;
}

interface Review { id: string; isReplied: boolean; createdAt: string; }

function isToday(d: string | null) {
  if (!d) return false;
  const dt = new Date(d), now = new Date();
  return dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate();
}

function isThisWeek(d: string | null) {
  if (!d) return false;
  return Date.now() - new Date(d).getTime() < 7 * 86400000;
}

const CARD_SHADOW = "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [s, j, r] = await Promise.all([
      fetch("/api/dashboard/stats").then(x => x.json()).catch(() => null),
      fetch("/api/jobs/list").then(x => x.json()).catch(() => []),
      fetch("/api/reputation/check").then(x => x.json()).catch(() => []),
    ]);
    setStats(s);
    setJobs(Array.isArray(j) ? j : []);
    setReviews(Array.isArray(r) ? r : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Computed values
  const todayScheduled  = jobs.filter(j => isToday(j.scheduledAt) && j.status === "scheduled").length;
  const todayInProgress = jobs.filter(j => j.status === "in_progress").length;
  const awaitingPayment = jobs.filter(j => j.status === "completed" || j.status === "invoiced").length;
  const unrepliedReviews = reviews.filter(r => !r.isReplied).length;
  const winbackCount = stats?.pendingRecovery ?? 0;

  // Closed loop this week
  const completedThisWeek = jobs.filter(j => isThisWeek(j.completedAt)).length;
  const paymentsThisWeek  = jobs.filter(j => j.status === "paid" && isThisWeek(j.completedAt)).length;
  const reviewsThisWeek   = reviews.filter(r => isThisWeek(r.createdAt)).length;
  const bookingsThisWeek  = jobs.filter(j => isThisWeek(j.createdAt)).length;

  const loopItems = [
    { label: "jobs completed", value: completedThisWeek, color: "text-[#B45309]" },
    { label: "payments received", value: paymentsThisWeek, color: "text-[#15803D]" },
    { label: "reviews collected", value: reviewsThisWeek, color: "text-[#1D4ED8]" },
    { label: "new bookings", value: bookingsThisWeek, color: "text-[#7C3AED]" },
  ];

  const actionCards = [
    {
      key: "jobs",
      emoji: "📋",
      emojiBg: "bg-amber-50",
      title: "Jobs Today",
      body: todayScheduled + todayInProgress === 0
        ? "No jobs scheduled today"
        : `${todayScheduled} scheduled · ${todayInProgress} in progress`,
      cta: "View Jobs →",
      ctaActive: true,
      href: "/dashboard/jobs?filter=today",
    },
    {
      key: "payment",
      emoji: "💳",
      emojiBg: "bg-green-50",
      title: "Awaiting Payment",
      body: awaitingPayment === 0
        ? "All caught up ✓"
        : `${awaitingPayment} completed job${awaitingPayment !== 1 ? "s" : ""} haven't been paid`,
      bodyGreen: awaitingPayment === 0,
      cta: awaitingPayment > 0 ? "Send Links →" : null,
      href: "/dashboard/jobs?filter=unpaid",
    },
    {
      key: "reviews",
      emoji: "⭐",
      emojiBg: "bg-yellow-50",
      title: "Reviews to Reply",
      body: unrepliedReviews === 0
        ? "All replied ✓"
        : `${unrepliedReviews} new review${unrepliedReviews !== 1 ? "s" : ""} need a response`,
      cta: unrepliedReviews > 0 ? "Reply Now →" : null,
      href: "/dashboard/reviews?filter=unreplied",
    },
    {
      key: "winback",
      emoji: "🔄",
      emojiBg: "bg-blue-50",
      title: "Win Back Customers",
      body: winbackCount === 0
        ? "No winback needed right now"
        : `${winbackCount} customer${winbackCount !== 1 ? "s" : ""} haven't booked in 90+ days`,
      cta: winbackCount > 0 ? "Send Campaign →" : null,
      href: "/dashboard/campaigns",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#0D1117]">
            {greeting}, {firstName}.
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Here&apos;s what needs attention.</p>
        </div>

        {/* Action cards — 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actionCards.map(card => (
            <div
              key={card.key}
              onClick={() => router.push(card.href)}
              className={`bg-white rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow ${CARD_SHADOW}`}
            >
              <div className="flex items-start gap-4">
                <div className={`${card.emojiBg} w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                  {card.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[#0D1117] mb-1">{card.title}</h3>
                  <p className={`text-sm ${(card as { bodyGreen?: boolean }).bodyGreen ? "text-[#15803D] font-medium" : "text-gray-500"}`}>
                    {card.body}
                  </p>
                  {card.cta && (
                    <span className="inline-block mt-3 text-sm font-semibold text-[#0D1117] hover:text-gray-600">
                      {card.cta}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closed loop summary */}
        <div className="bg-gray-100 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">This week</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {loopItems.map((item, i) => (
              <span key={item.label} className="flex items-center gap-2">
                <span className={`font-bold text-base ${item.value > 0 ? item.color : "text-gray-400"}`}>
                  {loading ? "—" : item.value}
                </span>
                <span className="text-gray-500">{item.label}</span>
                {i < loopItems.length - 1 && (
                  <span className="text-gray-300 font-light">→</span>
                )}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
