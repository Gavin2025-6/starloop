import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReviewReply } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, language = "en" } = await request.json();

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { business: true },
    });

    if (!review || review.business.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { reply } = await generateReviewReply({
      reviewContent: review.content ?? "",
      rating: review.rating,
      reviewerName: review.reviewerName ?? "",
      businessName: review.business.name,
      businessCategory: review.business.category ?? "Business",
      tone: review.business.aiReplyTone,
      language: language as "en" | "zh-CN",
    });

    await prisma.review.update({
      where: { id: reviewId },
      data: { aiDraftReply: reply },
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[AI/GenerateReply]", err);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
