import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import { sendSms } from "./twilio";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeCustomers(businessId: string) {
  const customers = await prisma.customer.findMany({ where: { businessId } });
  const now = new Date();

  const updates = customers.map((c) => {
    const days = c.lastServiceDate
      ? Math.floor((now.getTime() - c.lastServiceDate.getTime()) / 86400000)
      : 999;

    const status =
      days <= 60 ? "active" : days <= 120 ? "at-risk" : "lost";

    return prisma.customer.update({ where: { id: c.id }, data: { status } });
  });

  await Promise.all(updates);

  const refreshed = await prisma.customer.findMany({ where: { businessId } });
  return {
    active: refreshed.filter((c) => c.status === "active").length,
    atRisk: refreshed.filter((c) => c.status === "at-risk").length,
    lost: refreshed.filter((c) => c.status === "lost").length,
    total: refreshed.length,
  };
}

export async function generateWinbackSMS(
  customer: { name: string; lastServiceDate: Date | null },
  business: { name: string; industry: string; slug: string }
): Promise<string> {
  const daysAgo = customer.lastServiceDate
    ? Math.floor(
        (Date.now() - customer.lastServiceDate.getTime()) / 86400000
      )
    : 90;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Write a friendly, natural SMS (under 160 chars) from ${business.name} to ${customer.name} who last used their ${business.industry} service ${daysAgo} days ago. Offer to book again. End with: Book here: ${process.env.NEXT_PUBLIC_APP_URL}/b/${business.slug}\nNo hashtags. Sound like a human, not marketing.`,
      },
    ],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
}

export async function executeCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { business: true },
  });

  const statusFilter =
    campaign.targetSegment === "at-risk"
      ? ["at-risk"]
      : campaign.targetSegment === "lost"
      ? ["lost"]
      : ["at-risk", "lost"];

  const customers = await prisma.customer.findMany({
    where: { businessId: campaign.businessId, status: { in: statusFilter } },
  });

  const results = await Promise.allSettled(
    customers.map(async (customer) => {
      const sms = await generateWinbackSMS(customer, campaign.business);
      let smsSid: string | null = null;

      if (customer.phone) {
        try {
          smsSid = await sendSms({ to: customer.phone, body: sms });
        } catch {
          // log but don't block
        }
      }

      return prisma.campaignResult.create({
        data: {
          campaignId,
          customerId: customer.id,
          status: smsSid ? "sent" : "failed",
        },
      });
    })
  );

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "sent", sentAt: new Date() },
  });

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, total: customers.length };
}

export async function getDashboardStats(businessId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Today's date boundaries
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  // 7 days ago
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  // 30 days ago
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [thisMonthResults, customers, recentActivity, todayJobs, callsAnswered7d, invoicedUnpaid, reviewsRequested30d] = await Promise.all([
    prisma.campaignResult.findMany({
      where: {
        campaign: { businessId },
        sentAt: { gte: monthStart },
      },
    }),
    prisma.customer.findMany({ where: { businessId } }),
    prisma.campaignResult.findMany({
      where: { campaign: { businessId } },
      include: { customer: true },
      orderBy: { sentAt: "desc" },
      take: 5,
    }),
    // Today's jobs: scheduledAt = today OR createdAt = today, status != cancelled
    prisma.job.count({
      where: {
        businessId,
        status: { not: "cancelled" },
        OR: [
          { scheduledAt: { gte: todayStart, lt: todayEnd } },
          { createdAt: { gte: todayStart, lt: todayEnd } },
        ],
      },
    }),
    // Calls answered in last 7 days
    prisma.call.count({
      where: {
        businessId,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    // Sum of Invoice.total WHERE status = 'sent'
    prisma.invoice.aggregate({
      where: { businessId, status: "sent" },
      _sum: { total: true },
    }),
    // AgentLog WHERE agent='followup' AND action LIKE '%review%' AND last 30 days
    prisma.agentLog.count({
      where: {
        businessId,
        agent: "followup",
        action: { contains: "review", mode: "insensitive" },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const recovered = thisMonthResults.filter((r) => r.status === "replied");

  return {
    todayJobs,
    callsAnswered7d,
    invoicedUnpaid: invoicedUnpaid._sum.total ?? 0,
    reviewsRequested30d,
    thisMonthRecovered: recovered.length,
    thisMonthRevenue: recovered.reduce((sum, r) => sum + r.revenue, 0),
    pendingRecovery: customers.filter(
      (c) => c.status === "at-risk" || c.status === "lost"
    ).length,
    totalCustomers: customers.length,
    recentActivity: recentActivity.map((r) => ({
      id: r.id,
      customerName: r.customer.name,
      lastServiceDate: r.customer.lastServiceDate,
      status: r.status,
      revenue: r.revenue,
      sentAt: r.sentAt,
    })),
  };
}
