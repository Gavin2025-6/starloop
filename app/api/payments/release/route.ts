import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { releasePayment } from "@/lib/stripe-jobs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId } = await req.json();
    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    const job = await prisma.job.findUnique({ where: { id: jobId } });

    if (!job || !business || job.businessId !== business.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!job.stripePaymentIntentId) {
      return NextResponse.json({ error: "No payment to release" }, { status: 400 });
    }

    await releasePayment({ paymentIntentId: job.stripePaymentIntentId, jobId });
    return NextResponse.json({ released: true });
  } catch (err) {
    console.error("[payments/release]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
