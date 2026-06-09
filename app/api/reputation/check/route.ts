import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processReview } from "@/lib/agents/reputation-agent";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { platform, rating, content, authorName, reviewDate } = await req.json();
    if (!rating || !content) return NextResponse.json({ error: "rating and content required" }, { status: 400 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const result = await processReview({
      businessId: business.id,
      platform: platform ?? "google",
      rating: Number(rating),
      content,
      authorName: authorName ?? "Anonymous",
      reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[reputation/check]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json([]);

    const reviews = await prisma.review.findMany({
      where: { businessId: business.id },
      orderBy: { reviewDate: "desc" },
      take: 20,
    });

    return NextResponse.json(reviews);
  } catch (err) {
    console.error("[reputation/check GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
