import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
}

// Public endpoint — customer creates a PaymentIntent for their job
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const job = await prisma.job.findUnique({
      where: { clientToken: token },
      include: {
        business: { select: { stripeAccountId: true, stripeChargesEnabled: true } },
      },
    });

    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["awaiting_payment", "partially_paid"].includes(job.status)) {
      return NextResponse.json({ error: "Job is not awaiting payment" }, { status: 400 });
    }
    if (!job.business.stripeAccountId || !job.business.stripeChargesEnabled) {
      return NextResponse.json({ error: "Stripe not connected" }, { status: 400 });
    }

    const amountOwed = job.status === "partially_paid" ? job.balanceAmount : job.total;
    if (amountOwed < 0.5) {
      return NextResponse.json({ error: "Amount too small" }, { status: 400 });
    }

    const stripe = getStripe();
    const amountCents = Math.round(amountOwed * 100);
    const appFeeCents = Math.ceil(amountCents * 0.01);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "cad",
      application_fee_amount: appFeeCents,
      transfer_data: { destination: job.business.stripeAccountId },
      metadata: { jobId: job.id, businessId: job.businessId, clientToken: token },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("[pay/token/create-payment-intent]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
