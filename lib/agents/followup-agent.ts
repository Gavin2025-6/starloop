import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

export async function runFollowup(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      customer: true,
      business: { include: { googleConnection: true } },
    },
  });

  const { customer, business } = job;

  if (!customer.phone) {
    await prisma.jobEvent.create({
      data: { jobId, type: "sms_mocked", payload: { kind: "thank_you", reason: "no_phone" } },
    });
    return { sent: 0, reason: "no phone" };
  }

  const reviewUrl = business.googleConnection?.reviewUrl ?? null;
  const isTrial = process.env.TWILIO_MOCK === "1" || business.plan === "free" || business.plan === "trial";

  // T+0: Thank-you SMS
  const thankYouMsg = `Thanks for choosing ${business.name}! Your ${job.serviceType} service is complete.`;
  await sendSms({ to: customer.phone, body: thankYouMsg }).catch(() => {});
  await prisma.jobEvent.create({
    data: { jobId, type: isTrial && process.env.TWILIO_MOCK === "1" ? "sms_mocked" : "sms_sent", payload: { kind: "thank_you" } },
  });

  // T+0: Review request SMS (fire immediately for MVP)
  let reviewMsg: string;
  if (!isTrial && reviewUrl) {
    reviewMsg = `How was your ${job.serviceType} service from ${business.name}? Leave a review: ${reviewUrl}`;
  } else {
    reviewMsg = `How was your ${job.serviceType} service from ${business.name}? Your feedback means a lot!`;
  }
  await sendSms({ to: customer.phone, body: reviewMsg }).catch(() => {});
  await prisma.jobEvent.create({
    data: {
      jobId,
      type: isTrial && !reviewUrl ? "sms_mocked" : "sms_sent",
      payload: { kind: "review_request", reviewUrl: reviewUrl ?? null, sentAt: new Date().toISOString() },
    },
  });

  await prisma.customer.update({ where: { id: customer.id }, data: { lastFollowupAt: new Date() } });

  return { sent: 2 };
}
