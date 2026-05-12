import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
  if (!business) return NextResponse.json({ weeks: [], stats: {} });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { createdAt: true },
  });

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const reviews = await prisma.review.findMany({
    where: { businessId: business.id, publishedAt: { gte: ninetyDaysAgo } },
    select: { rating: true, publishedAt: true, isNegative: true, isReplied: true },
    orderBy: { publishedAt: "asc" },
  });

  // Group by week
  const weekMap: Record<string, { ratings: number[]; label: string }> = {};
  for (const r of reviews) {
    const d = new Date(r.publishedAt);
    // Get Monday of the week
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    if (!weekMap[key]) {
      weekMap[key] = {
        ratings: [],
        label: monday.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    }
    weekMap[key].ratings.push(r.rating);
  }

  const weeks = Object.entries(weekMap).map(([date, { ratings, label }]) => ({
    date,
    label,
    avg: parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)),
    count: ratings.length,
  }));

  // Stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthReviews = reviews.filter((r) => new Date(r.publishedAt) >= startOfMonth);
  const goodThisMonth = thisMonthReviews.filter((r) => r.rating >= 4).length;
  const repliedGoogle = reviews.filter((r) => r.isReplied && !r.isNegative);
  const googleReviews = reviews.filter((r) => !r.isNegative);
  const replyRate = googleReviews.length > 0
    ? Math.round((repliedGoogle.length / googleReviews.length) * 100)
    : 0;

  const allRatings = reviews.map((r) => r.rating);
  const avgRating = allRatings.length > 0
    ? parseFloat((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
    : 0;

  // Before/after signup split
  const signupDate = user?.createdAt;
  const beforeAvg = signupDate
    ? (() => {
        const br = reviews.filter((r) => new Date(r.publishedAt) < signupDate).map((r) => r.rating);
        return br.length > 0 ? parseFloat((br.reduce((a, b) => a + b, 0) / br.length).toFixed(1)) : null;
      })()
    : null;

  return NextResponse.json({
    weeks,
    signupDate: signupDate?.toISOString().slice(0, 10),
    stats: { goodThisMonth, replyRate, avgRating, beforeAvg },
  });
  } catch (err) {
    console.error("[Analytics/Ratings/GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
