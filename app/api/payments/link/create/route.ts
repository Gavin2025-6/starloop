import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { sendSms } from "@/lib/twilio";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({
      where: { id: jobId, businessId: business.id },
      include: { customer: true },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const stripe = getStripe();
    let chargesEnabled = false;
    if (business.stripeAccountId) {
      const acct = await stripe.accounts.retrieve(business.stripeAccountId);
      chargesEnabled = acct.charges_enabled ?? false;
    }

    if (!chargesEnabled || !business.stripeAccountId) {
      return NextResponse.json({ error: "Stripe Connect not ready", chargesEnabled: false }, { status: 422 });
    }

    const amountCents = Math.round((job.total ?? 0) * 100);
    if (amountCents < 50) return NextResponse.json({ error: "Amount too small (min $0.50)" }, { status: 400 });

    const applicationFeeCents = Math.ceil(amountCents * 0.01);

    // Price on platform account — required for destination charges
    const price = await stripe.prices.create({
      currency: "cad",
      unit_amount: amountCents,
      product_data: { name: `${job.serviceType} — ${business.name}` },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      application_fee_amount: applicationFeeCents,
      transfer_data: { destination: business.stripeAccountId! },
      metadata: { jobId: job.id },
    });

    await prisma.payment.upsert({
      where: { jobId: job.id },
      create: {
        jobId: job.id, businessId: business.id,
        stripePaymentLinkId: paymentLink.id,
        amount: job.total ?? 0, applicationFee: applicationFeeCents / 100, status: "pending",
      },
      update: {
        stripePaymentLinkId: paymentLink.id,
        amount: job.total ?? 0, applicationFee: applicationFeeCents / 100, status: "pending",
      },
    });

    await prisma.jobEvent.create({
      data: { jobId: job.id, type: "payment_link_created", payload: { amount: job.total, url: paymentLink.url } },
    });

    const isTrial = process.env.TWILIO_MOCK === "1";
    if (job.customer.phone) {
      if (isTrial) {
        await sendSms({ to: job.customer.phone, body: `Your job is complete! Please pay $${(job.total ?? 0).toFixed(2)} — link sent once your account is active.` }).catch(() => {});
        await prisma.jobEvent.create({ data: { jobId: job.id, type: "sms_mocked", payload: { kind: "payment_link", reason: "trial_no_url" } } });
      } else {
        await sendSms({ to: job.customer.phone, body: `Your job is complete! Please pay $${(job.total ?? 0).toFixed(2)} here: ${paymentLink.url}`.slice(0, 160) }).catch(() => {});
        await prisma.jobEvent.create({ data: { jobId: job.id, type: "sms_sent", payload: { kind: "payment_link", amount: job.total, customerName: job.customer.name } } });
      }
    }

    return NextResponse.json({ url: paymentLink.url, paymentLinkId: paymentLink.id });
  } catch (err) {
    console.error("[payments/link/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
