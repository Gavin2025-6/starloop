import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transitionJobStatus } from "@/lib/job-state-machine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { cancelReason, cancelledBy, toNoShow, chargeAmount } = await req.json().catch(() => ({}));

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({ where: { id, businessId: business.id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const targetStatus = toNoShow ? "no_show" : "cancelled";

    const updated = await transitionJobStatus(id, targetStatus, {
      triggeredBy: session.user.id,
      cancelReason: cancelReason || (toNoShow ? "No show" : "Cancelled by business owner"),
      cancelledBy: cancelledBy || "owner",
    });

    // Increment noShowCount on customer for no-shows
    if (toNoShow) {
      await prisma.customer.update({
        where: { id: job.customerId },
        data: { noShowCount: { increment: 1 } },
      });
    }

    // Attempt cancellation fee charge if setupIntentId and chargeAmount provided
    if (chargeAmount && job.setupIntentId && process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
        const amountCents = Math.round(parseFloat(String(chargeAmount)) * 100);
        if (amountCents > 0) {
          const setupIntent = await stripe.setupIntents.retrieve(job.setupIntentId);
          if (setupIntent.payment_method) {
            await stripe.paymentIntents.create({
              amount: amountCents,
              currency: "cad",
              customer: typeof setupIntent.customer === "string" ? setupIntent.customer : undefined,
              payment_method: setupIntent.payment_method as string,
              confirm: true,
              description: `${toNoShow ? "No-show" : "Late cancellation"} fee — Job ${job.jobNumber}`,
              metadata: { jobId: job.id },
            });
            await prisma.jobEvent.create({
              data: {
                jobId: job.id,
                type: "cancellation_fee_charged",
                payload: { amount: chargeAmount, type: toNoShow ? "no_show" : "late_cancellation" },
              },
            });
          }
        }
      } catch (stripeErr) {
        console.error("[jobs/cancel] cancellation fee charge failed", stripeErr);
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const isIllegal = msg.startsWith("Illegal transition");
    console.error("[jobs/cancel]", err);
    return NextResponse.json({ error: msg }, { status: isIllegal ? 400 : 500 });
  }
}
