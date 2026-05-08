import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import ReviewList from "@/components/dashboard/ReviewList";

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations();

  const business = await prisma.business.findFirst({
    where: { userId: session.user.id },
    include: {
      reviews: { orderBy: { publishedAt: "desc" } },
    },
  });

  const reviews = business?.reviews ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("reviews.title")}
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { label: t("reviews.allReviews"), count: reviews.length },
          {
            label: t("reviews.needsReply"),
            count: reviews.filter((r) => !r.isReplied).length,
          },
          {
            label: t("reviews.negative"),
            count: reviews.filter((r) => r.isNegative).length,
          },
        ].map((tab) => (
          <div
            key={tab.label}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700"
          >
            {tab.label}
            <span className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">
              {tab.count}
            </span>
          </div>
        ))}
      </div>

      {reviews.length > 0 ? (
        <ReviewList reviews={reviews} businessId={business!.id} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">⭐</div>
          <p className="text-gray-500 text-sm">{t("reviews.noReviews")}</p>
        </div>
      )}
    </div>
  );
}
