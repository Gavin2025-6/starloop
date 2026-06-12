import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: skip events already processed (use event.id as dedup key via JobEvent upsert)
  try {
    switch (event.type) {

      // ── account.updated (Connect: merchant onboarding) ──────────────────────
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        await prisma.business.updateMany({
          where: { stripeAccountId: acct.id },
          data: {
            stripeChargesEnabled: acct.charges_enabled ?? false,
            stripeOnboardedAt: (acct.charges_enabled && !acct.requirements?.currently_due?.length)
              ? new Date() : undefined,
          },
        });
        break;
      }

      // ── payment_intent.succeeded (Connect: customer paid via Payment Link) ──
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.jobId;
        if (!jobId) break;

        // Idempotency: check if this event was already handled
        const alreadyDone = await prisma.jobEvent.findFirst({
          where: { jobId, type: "payment_received", payload: { path: ["stripeEventId"], equals: event.id } },
        });
        if (alreadyDone) break;

        const amountPaid = pi.amount_received / 100;
        await prisma.job.update({ where: { id: jobId }, data: { status: "paid" } });
        await prisma.payment.updateMany({
          where: { jobId },
          data: { status: "paid", paidAt: new Date(), stripePaymentIntentId: pi.id },
        });
        await prisma.jobEvent.create({
          data: { jobId, type: "payment_received", payload: { amount: amountPaid, stripeEventId: event.id } },
        });
        break;
      }

      // ── charge.refunded ──────────────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const jobId = charge.metadata?.jobId;
        if (!jobId) break;
        await prisma.payment.updateMany({ where: { jobId }, data: { status: "refunded" } });
        await prisma.jobEvent.create({
          data: { jobId, type: "status_changed", payload: { from: "paid", to: "refunded", stripeEventId: event.id } },
        });
        break;
      }

      // ── charge.dispute.created ───────────────────────────────────────────────
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const charge = typeof dispute.charge === "string" ? await stripe.charges.retrieve(dispute.charge) : dispute.charge as Stripe.Charge;
        const jobId = charge.metadata?.jobId;
        if (!jobId) break;
        await prisma.payment.updateMany({ where: { jobId }, data: { status: "disputed" } });
        await prisma.jobEvent.create({
          data: { jobId, type: "status_changed", payload: { note: "Payment disputed", stripeEventId: event.id } },
        });
        break;
      }

      // ── legacy: payment_intent.payment_failed (card-on-file) ─────────────────
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.jobId;
        if (jobId) {
          await prisma.jobEvent.create({
            data: { jobId, type: "payment_failed", payload: { stripeEventId: event.id } },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[webhooks/stripe]", err);
  }

  return NextResponse.json({ received: true });
}
