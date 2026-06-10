import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { capturePayment, notifyCompletionSms } from "@/lib/stripe-jobs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId, finalAmount } = await req.json();
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { customer: true } });

    if (!job || !business || job.businessId !== business.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (!job.stripePaymentIntentId) {
      return NextResponse.json({ error: "No payment authorized for this job" }, { status: 400 });
    }

    const amount = finalAmount ?? job.total;
    const captured = await capturePayment({
      paymentIntentId: job.stripePaymentIntentId,
      finalAmountCents: Math.round(amount * 100),
      jobId,
    });

    if (job.customer.phone) {
      await notifyCompletionSms({
        customerPhone: job.customer.phone,
        customerName: job.customer.name,
        businessName: business.name,
        finalAmount: amount,
        jobId,
      }).catch(() => {});
    }

    return NextResponse.json({ captured: true, paymentIntent: captured.id });
  } catch (err) {
    console.error("[payments/capture]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
