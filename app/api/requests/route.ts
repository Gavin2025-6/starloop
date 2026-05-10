import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms, buildReviewRequestMessage } from "@/lib/twilio";
import { phoneToE164 } from "@/lib/utils";

function generateToken(): string {
  return randomBytes(16).toString("hex"); // 32-char hex, URL-safe
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId, businessId, channel = "SMS", scheduledAt } = await request.json();

  // Fetch user for plan + language
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, preferredLanguage: true },
  });

  // Free plan SMS limit: 10/month
  if (user?.plan === "FREE" && channel === "SMS") {
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const smsSentThisMonth = await prisma.reviewRequest.count({
      where: { businessId, channel: "SMS", sentAt: { gte: startOfMonth } },
    });
    if (smsSentThisMonth >= 10) {
      return NextResponse.json({
        error: "Free plan limit reached (10 SMS/month). Please upgrade to send more.",
        upgradeRequired: true,
      }, { status: 403 });
    }
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { customers: { where: { id: customerId } } },
  });

  if (!business || business.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customer = business.customers[0];
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Always use review gate — it routes 4-5★ to Google, captures 1-3★ privately
  const token = generateToken();
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/review/${token}`;

  // Detect language from user preference
  const language = (user?.preferredLanguage as "en" | "zh-CN") ?? "en";

  const messageBody = buildReviewRequestMessage({
    businessName: business.name,
    customerName: customer.name,
    reviewUrl,
    language,
  });

  let sentSid: string | undefined;
  let status: "SENT" | "FAILED" = "SENT";

  // If scheduled for later, don't send now
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

  if (!isScheduled && channel === "SMS" && customer.phone && process.env.TWILIO_ACCOUNT_SID) {
    try {
      sentSid = await sendSms({
        to: phoneToE164(customer.phone),
        body: messageBody,
      });
    } catch (err) {
      console.error("[Requests/SMS]", err);
      status = "FAILED";
    }
  }

  if (!isScheduled && channel === "EMAIL" && customer.email) {
    try {
      const { sendReviewRequestEmail } = await import("@/lib/resend");
      await sendReviewRequestEmail({
        to: customer.email,
        customerName: customer.name,
        businessName: business.name,
        reviewUrl,
        language,
      });
    } catch (err) {
      console.error("[Requests/EMAIL]", err);
      status = "FAILED";
    }
  }

  const reviewRequest = await prisma.reviewRequest.create({
    data: {
      businessId,
      customerId,
      token,
      status: isScheduled ? "PENDING" : status,
      sentAt: (!isScheduled && status === "SENT") ? new Date() : undefined,
      channel: channel as "SMS" | "EMAIL",
      messageBody,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true, requestId: reviewRequest.id, sid: sentSid });
}
