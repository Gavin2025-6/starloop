import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGoogleReviewUrl } from "@/lib/utils";
import { sendNewReviewNotification, sendNegativeReviewAlert } from "@/lib/resend";
import { generateReviewReply } from "@/lib/claude";

// GET /api/review-gate?token=xxx — fetch business info for the gate page
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const reviewRequest = await prisma.reviewRequest.findUnique({
    where: { token },
    include: {
      business: { select: { id: true, name: true, googleBusinessId: true, googleReviewUrl: true, category: true } },
      customer: { select: { name: true } },
    },
  });

  if (!reviewRequest) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  // Mark as clicked if not already
  if (!reviewRequest.clickedAt) {
    await prisma.reviewRequest.update({
      where: { token },
      data: { clickedAt: new Date(), status: "DELIVERED" },
    });
  }

  const googleUrl = reviewRequest.business.googleReviewUrl
    || (reviewRequest.business.googleBusinessId
        ? getGoogleReviewUrl(reviewRequest.business.googleBusinessId)
        : `https://www.google.com/maps/search/${encodeURIComponent(reviewRequest.business.name)}`);

  return NextResponse.json({
    businessName: reviewRequest.business.name,
    businessCategory: reviewRequest.business.category,
    customerName: reviewRequest.customer.name,
    googleUrl,
    requestId: reviewRequest.id,
  });
}

// POST /api/review-gate — submit rating + optional feedback
export async function POST(request: Request) {
  const { token, rating, feedback, contactPhone, contactEmail } = await request.json();

  if (!token || !rating) {
    return NextResponse.json({ error: "Missing token or rating" }, { status: 400 });
  }

  const reviewRequest = await prisma.reviewRequest.findUnique({
    where: { token },
    include: {
      business: {
        select: { id: true, name: true, category: true, googleBusinessId: true, googleReviewUrl: true, userId: true },
      },
      customer: { select: { name: true } },
    },
  });

  if (!reviewRequest) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  // Fetch business owner email for notifications
  const owner = await prisma.user.findUnique({
    where: { id: reviewRequest.business.userId },
    select: { email: true },
  });

  const isNegative = rating <= 3;

  // Mark request as reviewed
  await prisma.reviewRequest.update({
    where: { token },
    data: { reviewedAt: new Date(), status: "REVIEWED" },
  });

  if (isNegative) {
    // Save private feedback to Review table — never goes to Google
    try {
      const review = await prisma.review.create({
        data: {
          businessId: reviewRequest.businessId,
          platform: "GOOGLE",
          reviewerName: reviewRequest.customer.name,
          rating,
          content: feedback ?? "",
          publishedAt: new Date(),
          isNegative: true,
          isReplied: false,
          source: "PRIVATE",
        },
      });
      // Save contact fields via raw SQL to avoid stale Prisma client cache issues
      if (contactPhone || contactEmail) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Review" SET "contactPhone" = $1, "contactEmail" = $2 WHERE id = $3`,
          contactPhone ?? null,
          contactEmail ?? null,
          review.id
        );
      }

      // Generate AI suggestion and send urgent alert (fire-and-forget)
      if (owner?.email) {
        (async () => {
          let aiSuggestion: string | null = null;
          try {
            const { reply } = await generateReviewReply({
              reviewContent: feedback ?? "",
              rating,
              reviewerName: reviewRequest.customer.name,
              businessName: reviewRequest.business.name,
              businessCategory: reviewRequest.business.category ?? "Business",
              tone: "WARM",
              language: "en",
            });
            aiSuggestion = reply;
            // Save AI draft to review
            await prisma.review.update({
              where: { id: review.id },
              data: { aiDraftReply: reply },
            });
          } catch (e) {
            console.error("[review-gate/ai-draft]", e);
          }
          sendNegativeReviewAlert({
            to: owner.email!,
            businessName: reviewRequest.business.name,
            reviewerName: reviewRequest.customer.name,
            rating,
            content: feedback ?? "",
            contactPhone: contactPhone ?? null,
            contactEmail: contactEmail ?? null,
            aiSuggestion,
          }).catch((err) => console.error("[review-gate/negative-alert]", err));
        })();
      }
    } catch (err) {
      console.error("[review-gate POST] review.create failed:", err);
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: "saved" });
  }

  // Positive — notify owner and redirect to Google
  if (owner?.email) {
    sendNewReviewNotification({
      to: owner.email,
      businessName: reviewRequest.business.name,
      reviewerName: reviewRequest.customer.name,
      rating,
      content: feedback ?? "",
      reviewId: reviewRequest.id,
    }).catch((err) => console.error("[review-gate/new-review-notify]", err));
  }

  const googleUrl = reviewRequest.business.googleReviewUrl
    || (reviewRequest.business.googleBusinessId
        ? getGoogleReviewUrl(reviewRequest.business.googleBusinessId)
        : `https://www.google.com/maps/search/${encodeURIComponent(reviewRequest.business.name)}`);

  return NextResponse.json({ ok: true, action: "redirect", googleUrl });
}
