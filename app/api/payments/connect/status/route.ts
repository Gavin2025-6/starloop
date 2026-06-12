import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    if (!business.stripeAccountId) {
      return NextResponse.json({ connected: false, chargesEnabled: false });
    }

    // Always check live against Stripe (don't trust cache older than this request)
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(business.stripeAccountId);
    const chargesEnabled = account.charges_enabled ?? false;

    if (chargesEnabled !== business.stripeChargesEnabled) {
      await prisma.business.update({
        where: { id: business.id },
        data: { stripeChargesEnabled: chargesEnabled },
      });
    }

    return NextResponse.json({
      connected: true,
      chargesEnabled,
      accountId: business.stripeAccountId,
      onboardedAt: business.stripeOnboardedAt,
    });
  } catch (err) {
    console.error("[payments/connect/status]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
