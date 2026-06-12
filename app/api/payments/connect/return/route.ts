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
    if (!session?.user?.id) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);
    }

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business?.stripeAccountId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=payments&status=error`);
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(business.stripeAccountId);
    const chargesEnabled = account.charges_enabled ?? false;

    await prisma.business.update({
      where: { id: business.id },
      data: {
        stripeChargesEnabled: chargesEnabled,
        stripeOnboardedAt: chargesEnabled ? new Date() : undefined,
      },
    });

    const status = chargesEnabled ? "connected" : "pending";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=payments&status=${status}`
    );
  } catch (err) {
    console.error("[payments/connect/return]", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=payments&status=error`);
  }
}
