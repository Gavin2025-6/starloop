import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGoogleClient } from "@/lib/google/client";

interface GoogleReview {
  name: string;
  reviewer: { displayName: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  reviewReply?: { comment: string };
}

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connections = await prisma.googleBusinessConnection.findMany({
      where: { accessToken: { not: "" } },
      select: { businessId: true, locationId: true },
    });

    let totalNew = 0;
    const results: Array<{ businessId: string; new: number; error?: string }> = [];

    for (const conn of connections) {
      if (!conn.locationId) {
        results.push({ businessId: conn.businessId, new: 0, error: "no locationId" });
        continue;
      }

      try {
        const client = await getGoogleClient(conn.businessId);
        if (!client) {
          results.push({ businessId: conn.businessId, new: 0, error: "no client" });
          continue;
        }

        const headers = { Authorization: `Bearer ${client.accessToken}` };
        const res = await fetch(
          `https://mybusiness.googleapis.com/v4/${conn.locationId}/reviews?pageSize=50`,
          { headers }
        );

        if (!res.ok) {
          results.push({ businessId: conn.businessId, new: 0, error: `HTTP ${res.status}` });
          continue;
        }

        const data = await res.json();
        const reviews: GoogleReview[] = data.reviews ?? [];
        let newCount = 0;

        for (const r of reviews) {
          const existing = await prisma.review.findFirst({
            where: { businessId: conn.businessId, googleReviewId: r.name },
          });
          if (!existing) {
            await prisma.review.create({
              data: {
                businessId: conn.businessId,
                platform: "google",
                rating: STAR_MAP[r.starRating] ?? 0,
                content: r.comment ?? null,
                authorName: r.reviewer.displayName,
                aiReply: r.reviewReply?.comment ?? null,
                isReplied: !!r.reviewReply,
                reviewDate: new Date(r.createTime),
                googleReviewId: r.name,
              },
            });
            newCount++;
          }
        }

        await prisma.googleBusinessConnection.update({
          where: { businessId: conn.businessId },
          data: { lastSyncedAt: new Date() },
        });

        totalNew += newCount;
        results.push({ businessId: conn.businessId, new: newCount });
      } catch (err) {
        console.error("[cron/sync-reviews] business", conn.businessId, err);
        results.push({ businessId: conn.businessId, new: 0, error: String(err) });
      }
    }

    return NextResponse.json({ success: true, totalNew, results });
  } catch (err) {
    console.error("[cron/sync-reviews]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
