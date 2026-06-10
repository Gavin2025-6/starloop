import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

export async function runFollowup(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      customer: true,
      business: {
        include: { googleConnection: true },
      },
    },
  });

  const { customer, business } = job;

  if (!customer.phone) {
    return { sent: 0, reason: "no phone" };
  }

  const reviewUrl = business.googleConnection?.reviewUrl ?? null;
  const isPaid = business.plan !== "free" && business.plan !== "trial";

  // T+0: Thank-you SMS
  const thankYouMsg = `Thanks for choosing ${business.name}! Your service is complete. We'll follow up shortly.`;
  await sendSms({ to: customer.phone, body: thankYouMsg }).catch(() => {});

  // T+24h review request (in MVP: fire immediately, no real scheduling)
  let reviewMsg: string;
  if (isPaid && reviewUrl) {
    reviewMsg = `How was your ${job.serviceType} service from ${business.name}? Your feedback means a lot! Leave us a Google review: ${reviewUrl}`;
  } else {
    reviewMsg = `How was your ${job.serviceType} service from ${business.name}? Your feedback means a lot!`;
  }
  await sendSms({ to: customer.phone, body: reviewMsg }).catch(() => {});

  // Update Customer.lastFollowupAt
  await prisma.customer.update({
    where: { id: customer.id },
    data: { lastFollowupAt: new Date() },
  });

  // AgentLog: sequence started
  await prisma.agentLog.create({
    data: {
      businessId: business.id,
      agent: "followup",
      action: "follow-up sequence started",
      customerId: customer.id,
    },
  });

  // AgentLog: review request queued
  await prisma.agentLog.create({
    data: {
      businessId: business.id,
      agent: "followup",
      action: "review request queued",
      detail: `reviewUrl: ${reviewUrl ?? "none (trial)"}`,
      customerId: customer.id,
    },
  });

  return { sent: 2 };
}
