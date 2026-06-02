import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // One-time credit purchase
      if (session.mode === "payment" && session.metadata?.userId && session.metadata?.credits) {
        const userId = session.metadata.userId;
        const credits = parseInt(session.metadata.credits, 10);
        const packageKey = session.metadata.packageKey ?? "UNKNOWN";

        // Add credits atomically
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { smsCredits: { increment: credits } },
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: credits,
              type: "PURCHASE",
              note: `购买 ${packageKey} 充值包 (${credits} SMS)`,
              stripeSessionId: session.id,
            },
          }),
        ]);

        console.log(`[Stripe/Webhook] Credited ${credits} SMS to user ${userId}`);
      }
    }
  } catch (err) {
    console.error("[Stripe/Webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
