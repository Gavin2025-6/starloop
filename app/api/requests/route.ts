import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms, buildReviewRequestMessage } from "@/lib/twilio";
import { phoneToE164 } from "@/lib/utils";
import { sendRequestConfirmation, sendReviewRequestEmail } from "@/lib/resend";

function generateToken(): string {
  return randomBytes(16).toString("hex");
}

function isScheduledCheck(scheduledAt: string | undefined | null): boolean {
  return !!(scheduledAt && new Date(scheduledAt) > new Date());
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

  // SMS credit check — must have balance to send SMS
  if (channel === "SMS" && !isScheduledCheck(scheduledAt)) {
    const userWithCredits = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { smsCredits: true },
    });
    if ((userWithCredits?.smsCredits ?? 0) < 1) {
      return NextResponse.json({
        error: "短信余额不足，请先充值。",
        upgradeRequired: true,
        creditsRequired: true,
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

  // Service recovery protocol — collects feedback and notifies the owner for follow-up
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
  // Default PENDING for scheduled; for immediate: assume SENT until proven otherwise
  let status: "SENT" | "FAILED" = "SENT";

  // If scheduled for later, skip all sending now
  const isScheduled = !!(scheduledAt && new Date(scheduledAt) > new Date());

  console.log(`[Requests] channel=${channel} isScheduled=${isScheduled} customer.email=${customer.email ?? "none"} customer.phone=${customer.phone ?? "none"}`);

  if (!isScheduled && channel === "SMS") {
    if (!customer.phone) {
      console.error("[Requests/SMS] Customer has no phone number — marking FAILED");
      status = "FAILED";
    } else if (!process.env.TWILIO_ACCOUNT_SID) {
      console.error("[Requests/SMS] TWILIO_ACCOUNT_SID not set — marking FAILED");
      status = "FAILED";
    } else {
      try {
        console.log(`[Requests/SMS] Sending to ${customer.phone}`);
        sentSid = await sendSms({
          to: phoneToE164(customer.phone),
          body: messageBody,
        });
        console.log(`[Requests/SMS] Sent OK — sid=${sentSid}`);

        // Deduct 1 credit and record transaction
        await prisma.$transaction([
          prisma.user.update({
            where: { id: session.user.id },
            data: { smsCredits: { decrement: 1 } },
          }),
          prisma.creditTransaction.create({
            data: {
              userId: session.user.id,
              amount: -1,
              type: "SMS_SENT",
              note: `发送邀评短信给 ${customer.name}`,
            },
          }),
        ]);
      } catch (err) {
        console.error("[Requests/SMS] Send failed:", err);
        status = "FAILED";
      }
    }
  }

  if (!isScheduled && channel === "EMAIL") {
    if (!customer.email) {
      console.error("[Requests/EMAIL] Customer has no email address — marking FAILED");
      status = "FAILED";
    } else if (!process.env.RESEND_API_KEY) {
      console.error("[Requests/EMAIL] RESEND_API_KEY not set — marking FAILED");
      status = "FAILED";
    } else {
      try {
        console.log(`[Requests/EMAIL] Sending to ${customer.email}`);
        const result = await sendReviewRequestEmail({
          to: customer.email,
          customerName: customer.name,
          businessName: business.name,
          reviewUrl,
          language,
        });
        console.log(`[Requests/EMAIL] Sent OK — id=${JSON.stringify(result)}`);
      } catch (err) {
        console.error("[Requests/EMAIL] Send failed:", err);
        status = "FAILED";
      }
    }
  }

  console.log(`[Requests] Final status=${isScheduled ? "PENDING" : status}`);

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

  // Confirmation email to business owner (fire-and-forget)
  // Bug fix: correct operator precedence — wrap the OR condition in parens
  if (session.user.email && ((!isScheduled && status === "SENT") || isScheduled)) {
    sendRequestConfirmation({
      to: session.user.email,
      businessName: business.name,
      customerName: customer.name,
      channel: channel as "SMS" | "EMAIL",
      scheduledAt: isScheduled ? new Date(scheduledAt) : null,
    }).catch((err) => console.error("[Requests/confirmation-email]", err));
  }

  return NextResponse.json({ ok: true, requestId: reviewRequest.id, sid: sentSid, status: isScheduled ? "PENDING" : status });
}
