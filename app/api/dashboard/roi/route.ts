import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const monthParam = searchParams.get("month");

    const now = new Date();
    const monthStr =
      monthParam ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [year, monthNum] = monthStr.split("-").map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1);

    const business = await prisma.business.findFirst({
      where: businessId
        ? { id: businessId, userId: session.user.id }
        : { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    const [invitesSent, reviewsReceived, serviceRecoveries, recentRatingAgg] = await Promise.all([
      prisma.reviewRequest.count({
        where: {
          businessId: business.id,
          sentAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.review.count({
        where: {
          businessId: business.id,
          createdAt: { gte: monthStart, lt: monthEnd },
          source: "GOOGLE",
        },
      }),
      prisma.review.count({
        where: {
          businessId: business.id,
          createdAt: { gte: monthStart, lt: monthEnd },
          source: "PRIVATE",
        },
      }),
      prisma.review.aggregate({
        where: { businessId: business.id },
        _avg: { rating: true },
      }),
    ]);

    const conversionRate =
      invitesSent > 0 ? Number(((reviewsReceived / invitesSent) * 100).toFixed(1)) : 0;
    const ratingNow = recentRatingAgg._avg.rating
      ? Number(recentRatingAgg._avg.rating.toFixed(1))
      : null;
    const ratingBefore = business.onboardingRating ?? null;
    const estimatedNewCustomers = Math.round(reviewsReceived * 0.25);
    const estimatedRevenue = estimatedNewCustomers * (business.avgTransactionValue ?? 0);

    // Last 6 months snapshots
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, monthNum - 1 - i, 1);
      last6Months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    // Try MonthlySnapshot first, then calculate from DB
    const snapshots = await prisma.monthlySnapshot.findMany({
      where: { businessId: business.id, month: { in: last6Months } },
      orderBy: { month: "asc" },
    });

    // Fill missing months from DB
    const snapshotMap = new Map(snapshots.map((s) => [s.month, s]));
    const chartData: { month: string; reviews: number }[] = [];

    for (const m of last6Months) {
      if (snapshotMap.has(m)) {
        chartData.push({ month: m, reviews: snapshotMap.get(m)!.reviewsReceived });
      } else {
        const [y2, mo2] = m.split("-").map(Number);
        const mStart = new Date(y2, mo2 - 1, 1);
        const mEnd = new Date(y2, mo2, 1);
        const count = await prisma.review.count({
          where: {
            businessId: business.id,
            createdAt: { gte: mStart, lt: mEnd },
          },
        });
        chartData.push({ month: m, reviews: count });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        month: monthStr,
        invitesSent,
        reviewsReceived,
        conversionRate,
        ratingBefore,
        ratingNow,
        serviceRecoveryBlocked: serviceRecoveries,
        estimatedNewCustomers,
        estimatedRevenue,
        avgTransactionValue: business.avgTransactionValue,
        chartData,
      },
    });
  } catch (err) {
    console.error("[Dashboard/ROI]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
