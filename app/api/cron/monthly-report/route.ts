import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { sendReputationReportEmail } from "@/lib/resend";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Run for previous month's data
  const reportMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthStr = reportMonth.toISOString().slice(0, 7); // "2025-04"
  const monthStart = new Date(reportMonth.getFullYear(), reportMonth.getMonth(), 1);
  const monthEnd = new Date(reportMonth.getFullYear(), reportMonth.getMonth() + 1, 0, 23, 59, 59);
  const prevMonthStart = new Date(reportMonth.getFullYear(), reportMonth.getMonth() - 1, 1);
  const prevMonthEnd = new Date(reportMonth.getFullYear(), reportMonth.getMonth(), 0, 23, 59, 59);

  // Only paid businesses
  const paidUsers = await prisma.user.findMany({
    where: { plan: { in: ["STARTER", "PRO"] }, email: { not: "" } },
    include: { businesses: true },
  });

  let generated = 0;
  let failed = 0;

  for (const user of paidUsers) {
    const business = user.businesses[0];
    if (!business) continue;

    // Skip if already generated this month
    const existing = await prisma.reputationReport.findUnique({
      where: { businessId_month: { businessId: business.id, month: monthStr } },
    });
    if (existing) continue;

    try {
      // Fetch this month's reviews
      const reviews = await prisma.review.findMany({
        where: { businessId: business.id, publishedAt: { gte: monthStart, lte: monthEnd } },
        select: { rating: true, content: true, isNegative: true },
      });

      // Fetch previous month's reviews for comparison
      const prevReviews = await prisma.review.findMany({
        where: { businessId: business.id, publishedAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        select: { rating: true },
      });

      const totalReviews = reviews.length;
      const positiveCount = reviews.filter((r) => r.rating >= 4).length;
      const negativeCount = reviews.filter((r) => r.rating <= 2).length;
      const avgRating =
        totalReviews > 0
          ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1))
          : 0;
      const prevAvg =
        prevReviews.length > 0
          ? parseFloat((prevReviews.reduce((s, r) => s + r.rating, 0) / prevReviews.length).toFixed(1))
          : null;
      const ratingChange = prevAvg !== null ? parseFloat((avgRating - prevAvg).toFixed(1)) : null;

      // Build review text for AI
      const reviewTexts = reviews
        .filter((r) => r.content && r.content.length > 10)
        .map((r) => `[${r.rating}★] ${r.content}`)
        .slice(0, 30)
        .join("\n");

      let positiveKeywords: string[] = [];
      let negativeKeywords: string[] = [];
      let actionItems: string[] = [];
      let summary = "";

      if (totalReviews > 0 && reviewTexts.length > 0) {
        const prompt = `You are a reputation analyst for small businesses. Analyze these customer reviews for "${business.name}" (${business.category ?? "business"}) from last month and produce a concise report.

Reviews:
${reviewTexts}

Respond ONLY with a valid JSON object (no markdown, no extra text):
{
  "positiveKeywords": ["keyword1", "keyword2", "keyword3"],
  "negativeKeywords": ["issue1", "issue2"],
  "actionItems": ["Specific action 1", "Specific action 2", "Specific action 3"],
  "summary": "2-3 sentence executive summary of the month"
}

Rules:
- positiveKeywords: top 3-5 things customers praised (concrete nouns/phrases)
- negativeKeywords: top 2-3 complaints (be specific, not vague)
- actionItems: exactly 3 concrete, actionable recommendations based on actual complaints
- summary: professional, data-driven, encouraging tone`;

        const msg = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        });

        const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
        const parsed = JSON.parse(text);
        positiveKeywords = parsed.positiveKeywords ?? [];
        negativeKeywords = parsed.negativeKeywords ?? [];
        actionItems = parsed.actionItems ?? [];
        summary = parsed.summary ?? "";
      } else {
        summary = `No customer reviews were received in ${monthStr}. Consider sending more review requests to gather feedback.`;
        actionItems = [
          "Send review requests to recent customers via SMS or email",
          "Follow up with customers who haven't left a review yet",
          "Add your Google Review link to your email signature and receipts",
        ];
      }

      // Save report
      const report = await prisma.reputationReport.create({
        data: {
          businessId: business.id,
          month: monthStr,
          avgRating,
          totalReviews,
          positiveCount,
          negativeCount,
          ratingChange,
          positiveKeywords,
          negativeKeywords,
          actionItems,
          summary,
        },
      });

      // Send email to business owner
      if (user.email) {
        await sendReputationReportEmail({
          to: user.email,
          businessName: business.name,
          month: monthStr,
          report: {
            avgRating,
            totalReviews,
            positiveCount,
            negativeCount,
            ratingChange,
            positiveKeywords,
            negativeKeywords,
            actionItems,
            summary,
          },
        });

        await prisma.reputationReport.update({
          where: { id: report.id },
          data: { emailSentAt: new Date() },
        });
      }

      generated++;
    } catch (err) {
      console.error(`[monthly-report] Failed for business ${business.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ generated, failed });
}
