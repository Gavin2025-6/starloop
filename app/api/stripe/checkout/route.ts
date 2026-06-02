import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCreditCheckoutSession, type CreditPackageKey } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packageKey } = await request.json();
    if (!packageKey) {
      return NextResponse.json({ error: "packageKey required" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const url = await createCreditCheckoutSession({
      packageKey: packageKey as CreditPackageKey,
      userId: session.user.id,
      userEmail: session.user.email,
      successUrl: `${appUrl}/en/dashboard/billing?payment=success`,
      cancelUrl: `${appUrl}/en/dashboard/billing?payment=cancelled`,
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[Stripe/Checkout]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
