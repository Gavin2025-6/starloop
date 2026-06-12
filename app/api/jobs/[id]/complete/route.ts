import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runFollowup } from "@/lib/agents/followup-agent";
import Stripe from "stripe";
import { sendSms } from "@/lib/twilio";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { finalAmount, notes, internalNotes } = await req.json();

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const existing = await prisma.job.findUnique({ where: { id, businessId: business.id }, select: { status: true } });
    if (!existing) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const job = await prisma.job.update({
      where: { id, businessId: business.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        total: finalAmount ?? undefined,
        notes: notes || undefined,
        internalNotes: internalNotes || undefined,
      },
      include: { customer: true },
    });

    await prisma.jobEvent.create({
      data: { jobId: id, type: "status_changed", payload: { from: existing.status, to: "completed" } },
    });

    // Auto-create Payment Link if Stripe Connect is enabled
    let paymentLinkUrl: string | null = null;
    if (business.stripeAccountId && (job.total ?? 0) >= 0.5) {
      try {
        const stripe = getStripe();
        const acct = await stripe.accounts.retrieve(business.stripeAccountId);
        if (acct.charges_enabled) {
          const amountCents = Math.round((job.total ?? 0) * 100);
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
            transfer_data: { destination: business.stripeAccountId },
            metadata: { jobId: job.id, businessId: business.id },
          });

          paymentLinkUrl = paymentLink.url;

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
            data: { jobId: id, type: "payment_link_created", payload: { amount: job.total, url: paymentLinkUrl } },
          });

          if (job.customer.phone) {
            const isTrial = process.env.TWILIO_MOCK === "1";
            if (isTrial) {
              await sendSms({ to: job.customer.phone, body: `Your job is complete! Please pay $${(job.total ?? 0).toFixed(2)} — link sent once your account is active.` }).catch(() => {});
              await prisma.jobEvent.create({ data: { jobId: id, type: "sms_mocked", payload: { kind: "payment_link", reason: "trial_no_url" } } });
            } else {
              await sendSms({ to: job.customer.phone, body: `Your job is complete! Please pay $${(job.total ?? 0).toFixed(2)} here: ${paymentLinkUrl}`.slice(0, 160) }).catch(() => {});
              await prisma.jobEvent.create({ data: { jobId: id, type: "sms_sent", payload: { kind: "payment_link", amount: job.total, customerName: job.customer.name } } });
            }
          }
        }
      } catch (payErr) {
        console.error("[jobs/complete] payment link failed", payErr);
      }
    }

    await runFollowup(job.id).catch(() => {});

    return NextResponse.json({ ...job, paymentLinkUrl });
  } catch (err) {
    console.error("[jobs/complete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
