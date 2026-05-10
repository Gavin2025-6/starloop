import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { useTranslations } from "next-intl";
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("dashboard.welcomeBack")}, {session.user.name}
          </p>
        </div>
        {!business?.isGoogleConnected && (
          <Link
            href="/onboarding"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
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
        <h2 className="text-lg font-semibold mb-4">{t("reviews.title")}</h2>
        {business?.reviews.length ? (
          <ReviewList reviews={business.reviews} businessId={business.id} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-4">⭐</div>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              {t("dashboard.noReviews")}
            </p>
            <Link
              href="/onboarding"
              className="inline-block mt-4 text-blue-600 text-sm hover:underline"
            >
              {t("dashboard.connectGoogle")} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
