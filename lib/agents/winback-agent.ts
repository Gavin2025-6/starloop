import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// A/B test: even ID hash → template A, odd → template B
function getTemplate(customerId: string): "A" | "B" {
  const sum = customerId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return sum % 2 === 0 ? "A" : "B";
}

async function generateWinbackMessage(
  customer: { name: string; lastServiceDate: Date | null },
  business: { name: string; industry: string; slug: string },
  template: "A" | "B",
  daysInactive: number
): Promise<string> {
  const styleA = "warm and personal — mention the specific time passed, make them feel missed";
  const styleB = "value-focused — hint at a special offer or priority booking, create mild urgency";

  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 180,
    messages: [
      {
        role: "user",
        content: `Write a winback SMS (under 155 chars) from ${business.name} to ${customer.name}.
Style: ${template === "A" ? styleA : styleB}.
Context: ${daysInactive} days since last ${business.industry} service.
End with: Book: servicestar.app/b/${business.slug}
No hashtags. Sound human.`,
      },
    ],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

export async function runWinback(businessId: string) {
  const now = new Date();
  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      status: { in: ["at-risk", "lost"] },
      phone: { not: null },
    },
    include: { business: true },
  });

  let sent = 0;
  const results: { name: string; template: "A" | "B"; days: number }[] = [];

  for (const customer of customers) {
    const days = customer.lastServiceDate
      ? Math.floor((now.getTime() - customer.lastServiceDate.getTime()) / 86400000)
      : 180;

    const template = getTemplate(customer.id);
    const sms = await generateWinbackMessage(
      customer,
      customer.business,
      template,
      days
    );

    try {
      await sendSms({ to: customer.phone!, body: sms });
      sent++;
      results.push({ name: customer.name, template, days });
    } catch {
      // continue on failure
    }
  }

  if (sent > 0) {
    await prisma.agentLog.create({
      data: {
        businessId,
        agent: "winback",
        action: `Winback campaign sent`,
        detail: `${sent} messages (${results.filter((r) => r.template === "A").length} Template A, ${results.filter((r) => r.template === "B").length} Template B)`,
      },
    });
  }

  return { sent, total: customers.length, results };
}
