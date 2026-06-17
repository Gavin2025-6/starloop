import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { formatName } from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({
      where: { id, businessId: business.id },
      include: { customer: true },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const doneStatuses = ["completed", "awaiting_payment", "partially_paid", "paid"];
    if (!doneStatuses.includes(job.status)) {
      return NextResponse.json({ error: "Job must be complete before sending a review request" }, { status: 400 });
    }

    const reviewUrl = business.googleBusinessUrl || null;
    const isMock = process.env.TWILIO_MOCK === "1";

    if (job.customer.phone) {
      const customerName = formatName(job.customer.name);
      const body = reviewUrl
        ? `Hi ${customerName}, thanks for having us today. If you have a moment, we'd love to hear what you thought: ${reviewUrl} — ${business.name}`
        : `Hi ${customerName}, thanks for having us today. We'd love to hear what you thought — ${business.name}`;

      if (!isMock) {
        await sendSms({ to: job.customer.phone, body: body.slice(0, 320) }).catch(() => {});
      }
    }

    await prisma.jobEvent.create({
      data: {
        jobId: id,
        type: "sms_sent",
        payload: {
          kind: "review_request",
          customerName: job.customer.name,
          manual: true,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[jobs/review-request]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
