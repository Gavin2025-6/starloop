import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { randomBytes } from "crypto";

function generateCode(): string {
  return randomBytes(4).toString("hex"); // e.g. "a3f9b1c2"
}

export async function sendReferralInvite(customerId: string) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    include: { business: true },
  });

  if (!customer.phone) return null;

  // Check if referral already exists
  const existing = await prisma.referral.findFirst({ where: { customerId } });
  if (existing) return existing;

  const code = generateCode();
  const referral = await prisma.referral.create({
    data: { businessId: customer.businessId, customerId, code },
  });

  // Update customer referral code
  await prisma.customer.update({
    where: { id: customerId },
    data: { referralCode: code },
  });

  const refUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/referral/track?code=${code}`;
  const sms = `Hi ${customer.name}! You're a valued customer of ${customer.business.name}. Know anyone who needs ${customer.business.industry} service? Share this link and they'll get priority booking: ${refUrl}`;

  await sendSms({ to: customer.phone, body: sms.slice(0, 160) }).catch(() => {});

  await prisma.agentLog.create({
    data: {
      businessId: customer.businessId,
      agent: "referral",
      action: "Referral invite sent",
      detail: `Sent to ${customer.name} (code: ${code})`,
      customerId,
    },
  });

  return referral;
}

export async function trackReferralClick(code: string) {
  const referral = await prisma.referral.findUnique({
    where: { code },
    include: { business: true, customer: true },
  });
  if (!referral) return null;

  await prisma.referral.update({
    where: { code },
    data: { clicks: { increment: 1 } },
  });

  return referral;
}

export async function recordConversion(code: string) {
  const referral = await prisma.referral.findUnique({ where: { code } });
  if (!referral) return;

  await prisma.referral.update({
    where: { code },
    data: { conversions: { increment: 1 } },
  });

  // Reward referrer if first conversion and not yet rewarded
  if (referral.conversions === 0 && !referral.rewarded) {
    const customer = await prisma.customer.findUnique({
      where: { id: referral.customerId },
      include: { business: true },
    });

    if (customer?.phone) {
      await sendSms({
        to: customer.phone,
        body: `Great news, ${customer.name}! Someone you referred just booked with ${customer.business.name}. Thank you — we'll have a special thank-you ready for your next visit! 🙌`,
      }).catch(() => {});

      await prisma.referral.update({ where: { code }, data: { rewarded: true } });

      await prisma.agentLog.create({
        data: {
          businessId: referral.businessId,
          agent: "referral",
          action: "Referral converted + reward sent",
          detail: `Code ${code} — ${customer.name} rewarded`,
          customerId: customer.id,
        },
      });
    }
  }
}

// Send referral invites to recently satisfied customers (last 30 days, status=active)
export async function runReferralCampaign(businessId: string) {
  const cutoff = new Date(Date.now() - 30 * 86400000);
  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      status: "active",
      lastServiceDate: { gte: cutoff },
      phone: { not: null },
      referralCode: null, // not yet invited
    },
    take: 20,
  });

  let sent = 0;
  for (const c of customers) {
    await sendReferralInvite(c.id).catch(() => {});
    sent++;
  }

  return { sent };
}
