import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getTemplate(id: string): "A" | "B" {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 2 === 0 ? "A" : "B";
}

function getThresholds(spend: number): number[] {
  if (spend >= 500) return [45, 75, 120];
  if (spend >= 200) return [60, 100];
  return [90];
}

async function generateSms(customer: { name: string; lastServiceDate: Date | null }, business: { name: string; industry: string; slug: string }, template: "A" | "B", days: number): Promise<string> {
  const style = template === "A" ? "warm and personal, mention time passed" : "value-focused with mild urgency";
  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001", max_tokens: 180,
    messages: [{ role: "user", content: `Write winback SMS (under 155 chars) from ${business.name} to ${customer.name}. Style: ${style}. ${days} days since last ${business.industry} service. End: Book: servicestar.app/b/${business.slug}. No hashtags.` }],
  });
  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

export async function runWinback(businessId: string) {
  const now = new Date();
  const customers = await prisma.customer.findMany({
    where: { businessId, status: { in: ["at-risk", "lost"] }, phone: { not: null } },
    include: { business: true },
  });
  let sent = 0;
  const results: Array<{ name: string; template: "A"|"B"; days: number }> = [];
  for (const c of customers) {
    const days = c.lastServiceDate ? Math.floor((now.getTime() - c.lastServiceDate.getTime()) / 86400000) : 180;
    if (!getThresholds(c.totalSpend).some((t) => Math.abs(days - t) <= 2)) continue;
    if (c.lastFollowupAt && Math.floor((now.getTime() - c.lastFollowupAt.getTime()) / 86400000) < 90) continue;
    const template = getTemplate(c.id);
    const sms = await generateSms(c, c.business, template, days);
    try {
      await sendSms({ to: c.phone!, body: sms });
      await prisma.customer.update({ where: { id: c.id }, data: { lastFollowupAt: now } });
      sent++; results.push({ name: c.name, template, days });
    } catch { /* continue */ }
  }
  if (sent > 0) await prisma.agentLog.create({ data: { businessId, agent: "winback", action: `Smart winback: ${sent} messages`, detail: `${results.filter((r)=>r.template==="A").length}×A / ${results.filter((r)=>r.template==="B").length}×B` } });
  return { sent, total: customers.length, results };
}
