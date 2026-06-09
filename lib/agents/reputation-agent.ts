import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateAiReply(params: {
  businessName: string;
  industry: string;
  rating: number;
  content: string;
  authorName: string;
}): Promise<string> {
  const isNegative = params.rating <= 3;
  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Write a ${isNegative ? "empathetic, recovery-focused" : "warm, grateful"} Google review reply (under 100 words) for ${params.businessName} (${params.industry}).

Reviewer: ${params.authorName}
Rating: ${params.rating}/5
Review: "${params.content}"

${isNegative ? "Acknowledge the issue, apologize sincerely, offer to make it right." : "Thank them specifically, invite them back."} Sound human, not corporate.`,
      },
    ],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

export async function processReview(params: {
  businessId: string;
  platform: string;
  rating: number;
  content: string;
  authorName: string;
  reviewDate: Date;
}) {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: params.businessId },
  });

  // Generate AI reply for all reviews
  const aiReply = await generateAiReply({
    businessName: business.name,
    industry: business.industry,
    rating: params.rating,
    content: params.content,
    authorName: params.authorName,
  });

  // Save review
  const review = await prisma.review.create({
    data: {
      businessId: params.businessId,
      platform: params.platform,
      rating: params.rating,
      content: params.content,
      authorName: params.authorName,
      reviewDate: params.reviewDate,
      aiReply,
    },
  });

  // Bad review: SMS alert to business owner immediately
  if (params.rating <= 3 && business.phone) {
    const alert = `⭐${params.rating}/5 from ${params.authorName} on ${params.platform}: "${params.content.slice(0, 80)}..." — Suggested reply ready in dashboard.`;
    await sendSms({ to: business.phone, body: alert }).catch(() => {});
  }

  // Update public profile avg rating
  const reviews = await prisma.review.findMany({ where: { businessId: params.businessId } });
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await prisma.publicProfile.upsert({
    where: { businessId: params.businessId },
    update: { reviewCount: reviews.length, avgRating: Math.round(avg * 10) / 10 },
    create: { businessId: params.businessId, reviewCount: reviews.length, avgRating: Math.round(avg * 10) / 10 },
  });

  await prisma.agentLog.create({
    data: {
      businessId: params.businessId,
      agent: "reputation",
      action: params.rating <= 3 ? "🚨 Bad review alert sent" : "✨ AI reply generated",
      detail: `${params.rating}⭐ from ${params.authorName} on ${params.platform}`,
    },
  });

  return { review, aiReply };
}
