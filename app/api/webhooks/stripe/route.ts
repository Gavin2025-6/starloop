import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
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
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const jobId = pi.metadata?.jobId;
      if (jobId) {
        await prisma.job.update({ where: { id: jobId }, data: { status: "paid", captureStatus: "captured" } });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const jobId = pi.metadata?.jobId;
      const businessId = pi.metadata?.businessId;
      if (jobId && businessId) {
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (business?.phone) {
          await sendSms({
            to: business.phone,
            body: `⚠️ Payment failed for job ${jobId}. Please follow up with the customer.`,
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error("[webhooks/stripe]", err);
  }

  return NextResponse.json({ received: true });
}
