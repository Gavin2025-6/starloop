import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
}

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    let accountId = business.stripeAccountId;

    // Create Express account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: "individual",
        metadata: { serviceStarBusinessId: business.id },
      });
      accountId = account.id;
      await prisma.business.update({
        where: { id: business.id },
        data: { stripeAccountId: accountId },
      });
    }

    // Generate (or re-generate) Account Link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/api/payments/connect/refresh`,
      return_url: `${baseUrl}/api/payments/connect/return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("[payments/connect/start]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
