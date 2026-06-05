import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import StatsOverview from "@/components/dashboard/StatsOverview";
import ReviewList from "@/components/dashboard/ReviewList";
import RatingChart from "@/components/dashboard/RatingChart";
import { Link } from "@/i18n/navigation";
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, Languages, Send, Sparkles, TrendingUp } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { Suspense } from "react";
import OnboardingTour from "@/components/onboarding/OnboardingTour";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  const t = await getTranslations();

  const business = await prisma.business.findFirst({
    where: { userId: session.user.id },
    include: {
      reviews: {
        orderBy: { publishedAt: "desc" },
        take: 10,
      },
      _count: {
        select: { reviews: true, reviewRequests: true },
      },
    },
  });

  // Middleware guarantees Google is connected before the user reaches this page.
  // Compute stats directly from DB — no conditional hiding needed.
  const stats = business
    ? {
        totalReviews: business._count.reviews,
        pendingRequests: business._count.reviewRequests,
        averageRating:
          business.reviews.length > 0
            ? (
                business.reviews.reduce((sum, r) => sum + r.rating, 0) /
                business.reviews.length
              ).toFixed(1)
            : "—",
        needsReply: business.reviews.filter((r) => !r.isReplied).length,
      }
    : null;

  const privateIssues = business?.reviews.filter(
    (r) => r.source === "PRIVATE" && r.taskStatus !== "archived"
  ).length ?? 0;
  const urgentIssues = business?.reviews.filter(
    (r) => r.rating <= 3 && r.taskStatus !== "resolved" && r.taskStatus !== "archived"
  ).length ?? 0;
  const replyGaps = stats?.needsReply ?? 0;
  const promoters = business?.reviews.filter(
    (r) => r.rating >= 4 && r.source !== "PRIVATE"
  ).length ?? 0;
  const openActions = urgentIssues + privateIssues + replyGaps;

  const topIssue = urgentIssues > 0
    ? "Recover unhappy customers first"
    : replyGaps > 0
      ? "Clear reply gaps today"
      : "Send fresh feedback requests";

  const actionPlan = [
    {
      title: "Recover at-risk customers",
      detail: urgentIssues > 0
        ? `${urgentIssues} low-rating item${urgentIssues === 1 ? "" : "s"} need a recovery path.`
        : "No urgent low-rating recovery task is open.",
      href: "/dashboard/reviews",
      action: "Open recovery inbox",
      Icon: AlertTriangle,
      tone: "#B76200",
      bg: "#FFF7ED",
    },
    {
      title: "Ask for more feedback",
      detail: `${business?._count.reviewRequests ?? 0} request${(business?._count.reviewRequests ?? 0) === 1 ? "" : "s"} sent so far. Keep the loop fresh.`,
      href: "/dashboard/requests",
      action: "Send requests",
      Icon: Send,
      tone: "#087C6D",
      bg: "#EAFBF8",
    },
    {
      title: "Learn what to improve",
      detail: promoters > 0
        ? `${promoters} positive signal${promoters === 1 ? "" : "s"} can help shape future review growth.`
        : "Start collecting feedback so weekly patterns become visible.",
      href: "/dashboard/reports",
      action: "View reports",
      Icon: TrendingUp,
      tone: "#3157D5",
      bg: "#EEF3FF",
    },
  ];

  return (
    <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      {/* ── Action center ── */}
      <div
        className="mb-8 overflow-hidden rounded-2xl bg-white dashboard-overview"
        style={{ border: "1px solid #E5E7EB", boxShadow: "0 16px 50px rgba(15,23,42,0.06)" }}
      >
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-6 sm:p-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#EAFBF8", color: "#087C6D" }}>
              <Sparkles size={14} />
              Today&apos;s action center
            </div>
            <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl" style={{ color: "#0D1117" }}>
              {openActions > 0
                ? `${openActions} customer action${openActions === 1 ? "" : "s"} need attention.`
                : "All customers are handled. No open actions today."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: "#6B7280" }}>
              StarLoop turns feedback, review requests, recovery work, and reply gaps into a short list of owner actions.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/reviews"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                style={{ background: "#0D1117", color: "#FFFFFF" }}
              >
                Review actions
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/dashboard/requests"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                style={{ border: "1px solid #DDE5EF", color: "#0D1117" }}
              >
                Send feedback request
              </Link>
            </div>
          </div>

          <div className="border-t p-6 sm:p-7 lg:border-l lg:border-t-0" style={{ borderColor: "#E8ECF3", background: "#F8FAFC" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#7F8AA3" }}>
              Suggested priority
            </p>
            <h2 className="mt-3 text-xl font-bold" style={{ color: "#0D1117" }}>{topIssue}</h2>
            <div className="mt-5 grid gap-3">
              {actionPlan.map(({ title, detail, href, action, Icon, tone, bg }, index) => (
                <Link
                  key={title}
                  href={href}
                  className="group grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-xl bg-white p-3 transition-transform hover:-translate-y-0.5"
                  style={{ border: "1px solid #E6ECF4", animation: `pageFadeIn 200ms ease-out ${index * 50}ms both` }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: bg, color: tone }}>
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold" style={{ color: "#0D1117" }}>{title}</span>
                    <span className="mt-0.5 block text-xs leading-5" style={{ color: "#6B7280" }}>{detail}</span>
                  </span>
                  <span className="hidden text-xs font-semibold sm:block" style={{ color: "#087C6D" }}>{action}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && <StatsOverview stats={stats} />}

      {/* ── Trust brief ── */}
      <div
        className="mt-8 rounded-xl bg-white p-6 ai-reply-section"
        style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between review-request-section">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#EAFBF8", color: "#087C6D" }}>
              <Bot size={14} />
              AI operator active
            </div>
            <h2 className="text-xl font-bold" style={{ color: "#0D1117" }}>Customer trust brief</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "#6B7280" }}>
              A quick operating view of recovery risk, private feedback, reply gaps, and customer language.
            </p>
          </div>
          <Link
            href="/dashboard/requests"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            style={{ background: "#0D1117", color: "#FFFFFF" }}
          >
            Send requests
            <Send size={15} />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4 weekly-report-section">
          {[
            { label: "Needs owner attention", value: urgentIssues, helper: "Low-rating feedback not resolved", Icon: AlertTriangle, tone: "#B76200", bg: "#FFF7ED" },
            { label: "Recovery inbox",        value: privateIssues, helper: "Private issues captured",         Icon: CheckCircle2, tone: "#087C6D", bg: "#EAFBF8" },
            { label: "Reply gaps",            value: replyGaps,     helper: "Public reviews still open",       Icon: Bot,          tone: "#3157D5", bg: "#EEF3FF" },
            { label: "Language mode",         value: "Auto",        helper: "Customer language detection",     Icon: Languages,    tone: "#5B3FD5", bg: "#F4F1FF" },
          ].map(({ label, value, helper, Icon, tone, bg }, index) => (
            <div key={label} className="rounded-xl p-4" style={{ border: "1px solid #E8ECF3", background: "#FFFFFF", animation: `pageFadeIn 200ms ease-out ${index * 50}ms both` }}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: bg, color: tone }}>
                <Icon size={19} />
              </div>
              <div className="text-2xl font-bold" style={{ color: "#0D1117" }}>{value}</div>
              <div className="mt-1 text-sm font-medium" style={{ color: "#374151" }}>{label}</div>
              <div className="mt-1 text-xs leading-5" style={{ color: "#6B7280" }}>{helper}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rating chart ── */}
      <div className="mt-8 positive-reviews-section">
        <RatingChart />
      </div>

      {/* ── Reviews list ── */}
      <div className="mt-8 reviews-list">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#0D1117" }}>
          {t("reviews.title")}
        </h2>
        {business?.reviews.length ? (
          <ReviewList reviews={business.reviews} businessId={business.id} />
        ) : (
          <EmptyState
            type="reviews"
            title={t("reviews.title")}
            description={t("dashboard.noReviews")}
            action={
              <Link
                href="/dashboard/requests"
                className="inline-block mt-4 text-sm font-medium hover:underline"
                style={{ color: "#0D1117" }}
              >
                发送首条邀评请求 →
              </Link>
            }
          />
        )}
      </div>

      <Suspense fallback={null}>
        <OnboardingTour />
      </Suspense>
    </div>
  );
}
