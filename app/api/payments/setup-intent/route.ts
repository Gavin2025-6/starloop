import { NextRequest, NextResponse } from "next/server";
import { createSetupIntent, createStripeCustomer } from "@/lib/stripe-jobs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json();
    if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Create or reuse Stripe customer
    let stripeCustomerId = customer.notes?.startsWith("stripe:") ? customer.notes.slice(7) : null;
    if (!stripeCustomerId) {
      const sc = await createStripeCustomer({
        name: customer.name, email: customer.email, phone: customer.phone,
        serviceStarCustomerId: customer.id,
      });
      stripeCustomerId = sc.id;
      await prisma.customer.update({ where: { id: customerId }, data: { notes: `stripe:${sc.id}` } });
    }

    const si = await createSetupIntent(stripeCustomerId);
    return NextResponse.json({ clientSecret: si.client_secret, stripeCustomerId });
  } catch (err) {
    console.error("[payments/setup-intent]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
