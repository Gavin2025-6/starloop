import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import StatsOverview from "@/components/dashboard/StatsOverview";
import ReviewList from "@/components/dashboard/ReviewList";
import RatingChart from "@/components/dashboard/RatingChart";
import { Link } from "@/i18n/navigation";

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

  const stats = business
    ? {
        totalReviews: business._count.reviews,
        pendingRequests: business._count.reviewRequests,
        averageRating:
          business.reviews.length > 0
            ? (
                business.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
                business.reviews.length
              ).toFixed(1)
            : "—",
        needsReply: business.reviews.filter((r) => !r.isReplied).length,
      }
    : null;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>
            {t("dashboard.title")}
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {t("dashboard.welcomeBack")}, <span className="font-medium" style={{ color: "#1A1D23" }}>{session.user.name}</span>
          </p>
        </div>
        {!business?.isGoogleConnected && (
          <Link
            href="/onboarding"
            className="text-white text-sm font-semibold px-4 py-2.5 transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #00C9A7 0%, #4A6FFF 100%)",
              borderRadius: "10px",
            }}
          >
            {t("dashboard.connectGoogle")} →
          </Link>
        )}
      </div>

      {stats && <StatsOverview stats={stats} />}

      <div className="mt-8">
        <RatingChart />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#1A1D23" }}>
          {t("reviews.title")}
        </h2>
        {business?.reviews.length ? (
          <ReviewList reviews={business.reviews} businessId={business.id} />
        ) : (
          <div
            className="bg-white rounded-2xl p-12 text-center"
            style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, rgba(0,201,167,0.1), rgba(74,111,255,0.1))" }}
            >
              ⭐
            </div>
            <p className="text-sm max-w-xs mx-auto" style={{ color: "#6B7280" }}>
              {t("dashboard.noReviews")}
            </p>
            <Link
              href="/onboarding"
              className="inline-block mt-4 text-sm font-medium hover:underline"
              style={{ color: "#4A6FFF" }}
            >
              {t("dashboard.connectGoogle")} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
