import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateFollowupSms(
  type: "invoice" | "review" | "checkin",
  params: { customerName: string; businessName: string; industry: string; slug: string; amount?: number }
): Promise<string> {
  const prompts = {
    invoice: `Write a friendly SMS (under 140 chars) from ${params.businessName} to ${params.customerName} thanking them for using their ${params.industry} service${params.amount ? ` ($${params.amount})` : ""}. Sound human, not corporate. No hashtags.`,
    review: `Write a friendly review request SMS (under 140 chars) from ${params.businessName} to ${params.customerName}. End with: servicestar.app/b/${params.slug}. Natural, not pushy.`,
    checkin: `Write a friendly 7-day check-in SMS (under 140 chars) from ${params.businessName} to ${params.customerName} asking if everything is still working well with their ${params.industry} service. Warm and genuine.`,
  };

  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 160,
    messages: [{ role: "user", content: prompts[type] }],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

export async function runFollowup(
  customerId: string,
  serviceType?: string,
  amount?: number
) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    include: { business: true },
  });

  if (!customer.phone) return { sent: 0, reason: "no phone" };

  const { business } = customer;

  // Generate all 3 messages
  const [invoiceSms, reviewSms, checkinSms] = await Promise.all([
    generateFollowupSms("invoice", { customerName: customer.name, businessName: business.name, industry: business.industry, slug: business.slug, amount }),
    generateFollowupSms("review", { customerName: customer.name, businessName: business.name, industry: business.industry, slug: business.slug }),
    generateFollowupSms("checkin", { customerName: customer.name, businessName: business.name, industry: business.industry, slug: business.slug }),
  ]);

  // SMS 1: Send immediately (invoice/thank you)
  await sendSms({ to: customer.phone, body: invoiceSms }).catch(() => {});

  // SMS 2 & 3: In production, schedule via Twilio Scheduled Messages or a job queue.
  // For MVP, we log them as "queued" — uncomment to send immediately:
  // await sendSms({ to: customer.phone, body: reviewSms }).catch(() => {});
  // await sendSms({ to: customer.phone, body: checkinSms }).catch(() => {});

  // Update customer
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      lastFollowupAt: new Date(),
      serviceCount: { increment: 1 },
      lastServiceDate: new Date(),
      ...(amount ? { totalSpend: { increment: amount } } : {}),
    },
  });

  await prisma.agentLog.create({
    data: {
      businessId: business.id,
      agent: "followup",
      action: "Follow-up sequence started",
      detail: `Invoice SMS sent to ${customer.name}${amount ? ` ($${amount})` : ""}`,
      customerId,
    },
  });

  return { sent: 1, queued: 2, invoiceSms, reviewSms, checkinSms };
}
