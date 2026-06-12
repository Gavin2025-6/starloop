import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleClient, discoverAndSaveLocation } from "@/lib/google/client";

interface GoogleReview {
  reviewId: string;
  name: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const client = await getGoogleClient(business.id);
    if (!client) return NextResponse.json({ error: "Google not connected" }, { status: 400 });

    // Auto-discover location if not saved yet
    let locationId = client.locationId;
    if (!locationId) {
      locationId = await discoverAndSaveLocation(business.id);
    }
    if (!locationId) {
      return NextResponse.json({ error: "No Google location found. Connect Google Business Profile first." }, { status: 400 });
    }

    const headers = { Authorization: `Bearer ${client.accessToken}` };
    const url = `https://mybusiness.googleapis.com/v4/${locationId}/reviews?pageSize=50`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      console.error("[reviews/sync] Google API error:", res.status, text);
      return NextResponse.json({ error: "Google API error", detail: text }, { status: 502 });
    }

    const data = await res.json();
    const reviews: GoogleReview[] = data.reviews ?? [];

    let newCount = 0;
    for (const r of reviews) {
      const rating = STAR_MAP[r.starRating] ?? 0;
      const existing = await prisma.review.findFirst({
        where: { businessId: business.id, googleReviewId: r.name },
      });

      if (existing) {
        // Update if reply was added externally
        if (r.reviewReply && !existing.isReplied) {
          await prisma.review.update({
            where: { id: existing.id },
            data: { aiReply: r.reviewReply.comment, isReplied: true },
          });
        }
      } else {
        await prisma.review.create({
          data: {
            businessId: business.id,
            platform: "google",
            rating,
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

    // Update lastSyncedAt
    await prisma.googleBusinessConnection.update({
      where: { businessId: business.id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({ success: true, synced: reviews.length, newReviews: newCount });
  } catch (err) {
    console.error("[reviews/sync]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
