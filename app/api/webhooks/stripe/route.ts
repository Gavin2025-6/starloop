import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Stripe/Webhook] Invalid signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const priceId = sub.items.data[0]?.price.id;

      const plan =
        priceId === process.env.STRIPE_PRO_PRICE_ID
          ? "PRO"
          : priceId === process.env.STRIPE_STARTER_PRICE_ID
          ? "STARTER"
          : "FREE";

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan, stripeSubscriptionId: sub.id },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: "FREE" },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
