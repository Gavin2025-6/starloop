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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=payments`);
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: business.stripeAccountId,
      refresh_url: `${baseUrl}/api/payments/connect/refresh`,
      return_url: `${baseUrl}/api/payments/connect/return`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (err) {
    console.error("[payments/connect/refresh]", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=payments&status=error`);
  }
}
