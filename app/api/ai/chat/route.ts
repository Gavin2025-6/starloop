import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await request.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const business = await prisma.business.findFirst({
    where: { userId: session.user.id },
    select: { id: true, name: true, category: true, googleReviewUrl: true },
  });

  if (!business) {
    return NextResponse.json({ reply: "Please set up your business profile in Settings first." });
  }

  // Gather business context
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentReviews = await prisma.review.findMany({
    where: { businessId: business.id, publishedAt: { gte: thirtyDaysAgo } },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: { rating: true, content: true, reviewerName: true, isReplied: true, isNegative: true, publishedAt: true },
  });

  const allRatings = await prisma.review.findMany({
    where: { businessId: business.id },
    select: { rating: true },
  });

  const avgRating =
    allRatings.length > 0
      ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(1)
      : "N/A";

  const negativeReviews = recentReviews.filter((r) => r.rating <= 2 || r.isNegative);
  const unreplied = recentReviews.filter((r) => !r.isReplied && !r.isNegative);

  const sentThisMonth = await prisma.reviewRequest.count({
    where: {
      businessId: business.id,
      sentAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
    },
  });

  const reviewSummary = recentReviews
    .map((r) => `[${r.rating}★${r.isReplied ? " replied" : ""}] ${r.reviewerName ?? "Anon"}: ${r.content?.slice(0, 120) ?? "(no text)"}`)
    .join("\n");

  const negativeSummary = negativeReviews
    .map((r) => `[${r.rating}★] ${r.reviewerName ?? "Anon"}: ${r.content?.slice(0, 200) ?? "(no text)"}`)
    .join("\n");

  const systemPrompt = `You are the StarLoop AI assistant — a reputation management expert helping small business owners. You have access to real data for this business and provide specific, actionable advice (not generic tips).

BUSINESS PROFILE:
- Name: ${business.name}
- Category: ${business.category ?? "Not set"}
- Overall avg rating: ${avgRating}/5 (from ${allRatings.length} total reviews)

LAST 30 DAYS:
- New reviews: ${recentReviews.length}
- Negative reviews (≤2★): ${negativeReviews.length}
- Unreplied positive reviews: ${unreplied.length}
- Review requests sent this month: ${sentThisMonth}

RECENT REVIEWS (last 30 days):
${reviewSummary || "No reviews in last 30 days."}

${negativeSummary ? `NEGATIVE REVIEWS NEEDING ATTENTION:\n${negativeSummary}` : "No negative reviews recently."}

RULES:
- Always base advice on the actual data above
- When writing reply drafts, be specific to the review content
- Keep responses concise (under 200 words unless drafting a reply)
- Use a warm, professional tone
- If asked about improving rating, reference specific patterns from the reviews`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply });
}
