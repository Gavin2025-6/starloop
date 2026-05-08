import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms, buildReviewRequestMessage } from "@/lib/twilio";
import { getGoogleReviewUrl, phoneToE164 } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId, businessId, channel = "SMS" } = await request.json();

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

  const reviewUrl = business.googleBusinessId
    ? getGoogleReviewUrl(business.googleBusinessId)
    : `${process.env.NEXT_PUBLIC_APP_URL}/review/${businessId}`;

  // Detect language from user preference
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const language = (user?.preferredLanguage as "en" | "zh-CN") ?? "en";

  const messageBody = buildReviewRequestMessage({
    businessName: business.name,
    customerName: customer.name,
    reviewUrl,
    language,
  });

  let sentSid: string | undefined;
  let status: "SENT" | "FAILED" = "SENT";

  if (channel === "SMS" && customer.phone && process.env.TWILIO_ACCOUNT_SID) {
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

  const reviewRequest = await prisma.reviewRequest.create({
    data: {
      businessId,
      customerId,
      status,
      sentAt: status === "SENT" ? new Date() : undefined,
      channel: channel as "SMS" | "EMAIL",
      messageBody,
      nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    },
  });

  return NextResponse.json({ ok: true, requestId: reviewRequest.id, sid: sentSid });
}
