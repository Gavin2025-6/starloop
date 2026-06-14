import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { transitionJobStatus } from "@/lib/job-state-machine";

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

  try {
    switch (event.type) {

      // ── account.updated (Connect: merchant onboarding) ──────────────────────
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        await prisma.business.updateMany({
          where: { stripeAccountId: acct.id },
          data: {
            stripeChargesEnabled: acct.charges_enabled ?? false,
            stripeOnboardedAt:
              acct.charges_enabled && !acct.requirements?.currently_due?.length
                ? new Date()
                : undefined,
          },
        });
        break;
      }

      // ── payment_intent.succeeded (Connect: customer paid via Payment Link) ──
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.jobId;
        if (!jobId) break;

        // Idempotency: skip if this exact event was already handled
        const alreadyDone = await prisma.jobEvent.findFirst({
          where: {
            jobId,
            type: "payment_received",
            payload: { path: ["stripeEventId"], equals: event.id },
          },
        });
        if (alreadyDone) break;

        const amountPaid = pi.amount_received / 100;

        // Record the raw payment receipt (separate from status change)
        await prisma.jobEvent.create({
          data: {
            jobId,
            type: "payment_received",
            triggeredBy: "stripe_webhook",
            payload: { amount: amountPaid, stripeEventId: event.id, paymentIntentId: pi.id },
          },
        });

        const job = await prisma.job.findUnique({
          where: { id: jobId },
          select: { total: true, paidAmount: true, status: true },
        });
        if (!job) break;

        const totalOwed = job.total;
        const alreadyPaid = job.paidAmount ?? 0;
        const totalPaidNow = alreadyPaid + amountPaid;

        // Overpayment / tip: if paid >= total (with a 1-cent tolerance), it's PAID
        if (totalPaidNow >= totalOwed - 0.01) {
          await transitionJobStatus(jobId, "paid", {
            triggeredBy: "stripe_webhook",
            paidAmount: totalPaidNow,
            paymentIntentId: pi.id,
            stripeEventId: event.id,
          });
        } else {
          await transitionJobStatus(jobId, "partially_paid", {
            triggeredBy: "stripe_webhook",
            paidAmount: totalPaidNow,
            paymentIntentId: pi.id,
            stripeEventId: event.id,
          });
        }
        break;
      }

      // ── charge.refunded ──────────────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const jobId = charge.metadata?.jobId;
        if (!jobId) break;
        await prisma.payment.updateMany({ where: { jobId }, data: { status: "refunded" } });
        await prisma.jobEvent.create({
          data: {
            jobId,
            type: "refunded",
            triggeredBy: "stripe_webhook",
            payload: { stripeEventId: event.id },
          },
        });
        break;
      }

      // ── charge.dispute.created ───────────────────────────────────────────────
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const charge =
          typeof dispute.charge === "string"
            ? await stripe.charges.retrieve(dispute.charge)
            : (dispute.charge as Stripe.Charge);
        const jobId = charge.metadata?.jobId;
        if (!jobId) break;
        await prisma.payment.updateMany({ where: { jobId }, data: { status: "disputed" } });
        await prisma.jobEvent.create({
          data: {
            jobId,
            type: "disputed",
            triggeredBy: "stripe_webhook",
            payload: { note: "Payment disputed", stripeEventId: event.id },
          },
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.jobId;
        if (jobId) {
          await prisma.jobEvent.create({
            data: {
              jobId,
              type: "payment_failed",
              triggeredBy: "stripe_webhook",
              payload: { stripeEventId: event.id },
            },
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
