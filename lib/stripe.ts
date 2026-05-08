import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export const PLANS = {
  STARTER: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    name: "Starter",
    price: 39,
    features: [
      "1 business location",
      "Unlimited review requests",
      "AI reply generation",
      "Google Business sync",
      "SMS notifications",
    ],
  },
  PRO: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: "Pro",
    price: 79,
    features: [
      "Up to 5 business locations",
      "Unlimited review requests",
      "AI reply generation (priority)",
      "Google Business sync",
      "SMS + Email notifications",
      "Analytics & reporting",
    ],
  },
};

export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  return session.url!;
}

export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
  return session.url;
}
