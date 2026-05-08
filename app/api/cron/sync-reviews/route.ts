import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReviews, refreshAccessToken } from "@/lib/google";

// Called by Railway cron or uptime monitor
// Requires: x-cron-secret header matching CRON_SECRET env var
export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businesses = await prisma.business.findMany({
    where: { isGoogleConnected: true, googleBusinessId: { not: null } },
  });

  let synced = 0;
  let newReviews = 0;

  for (const business of businesses) {
    try {
      let accessToken = business.googleAccessToken!;

      // Refresh token if expired
      if (
        business.googleTokenExpiry &&
        new Date() > business.googleTokenExpiry &&
        business.googleRefreshToken
      ) {
        const newCreds = await refreshAccessToken(business.googleRefreshToken);
        accessToken = newCreds.access_token!;
        await prisma.business.update({
          where: { id: business.id },
          data: {
            googleAccessToken: newCreds.access_token ?? undefined,
            googleTokenExpiry: newCreds.expiry_date
              ? new Date(newCreds.expiry_date)
              : undefined,
          },
        });
      }

      const reviews = await getReviews(
        accessToken,
        business.googleBusinessId!
      );

      for (const r of reviews) {
        const isNegative = r.rating <= 3;
        await prisma.review.upsert({
          where: {
            businessId_externalId: {
              businessId: business.id,
              externalId: r.reviewId,
            },
          },
          update: {},
          create: {
            businessId: business.id,
            externalId: r.reviewId,
            platform: "GOOGLE",
            reviewerName: r.reviewer,
            rating: r.rating,
            content: r.comment,
            publishedAt: new Date(r.createTime),
            isNegative,
          },
        });
        newReviews++;
      }

      synced++;
    } catch (err) {
      console.error(`[Cron/SyncReviews] business ${business.id}:`, err);
    }
  }

  console.log(`[Cron/SyncReviews] synced:${synced} newReviews:${newReviews}`);
  return NextResponse.json({ ok: true, synced, newReviews });
}
