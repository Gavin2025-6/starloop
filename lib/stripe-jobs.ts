import Stripe from "stripe";
import { sendSms } from "./twilio";
import { prisma } from "./prisma";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion });
  return _stripe;
}

export async function createStripeCustomer(params: {
  name: string; email?: string | null; phone?: string | null; serviceStarCustomerId: string;
}) {
  const customer = await getStripe().customers.create({
    name: params.name,
    email: params.email || undefined,
    phone: params.phone || undefined,
    metadata: { serviceStarCustomerId: params.serviceStarCustomerId },
  });
  return customer;
}

export async function createSetupIntent(stripeCustomerId: string) {
  const si = await getStripe().setupIntents.create({
    customer: stripeCustomerId,
    usage: "off_session",
    automatic_payment_methods: { enabled: true },
  });
  return si;
}

export async function createPaymentAuthorization(params: {
  stripeCustomerId: string;
  paymentMethodId: string;
  amountCents: number;
  jobId: string;
  businessId: string;
}) {
  const pi = await getStripe().paymentIntents.create({
    amount: params.amountCents,
    currency: "cad",
    capture_method: "manual",
    customer: params.stripeCustomerId,
    payment_method: params.paymentMethodId,
    confirm: true,
    off_session: true,
    metadata: { jobId: params.jobId, businessId: params.businessId },
  });
  return pi;
}

export async function capturePayment(params: {
  paymentIntentId: string; finalAmountCents: number; jobId: string;
}) {
  const captured = await getStripe().paymentIntents.capture(params.paymentIntentId, {
    amount_to_capture: params.finalAmountCents,
  });

  // Update job
  await prisma.job.update({
    where: { id: params.jobId },
    data: { status: "paid", captureStatus: "captured" },
  });

  return captured;
}

export async function releasePayment(params: { paymentIntentId: string; jobId: string }) {
  const cancelled = await getStripe().paymentIntents.cancel(params.paymentIntentId);

  await prisma.job.update({
    where: { id: params.jobId },
    data: { captureStatus: "released" },
  });

  return cancelled;
}

export async function notifyCompletionSms(params: {
  customerPhone: string; customerName: string; businessName: string;
  finalAmount: number; jobId: string;
}) {
  const msg = `Hi ${params.customerName}, your service with ${params.businessName} is complete! Final amount: $${params.finalAmount}. Payment will be processed in 24 hours. Questions? Reply here.`;
  await sendSms({ to: params.customerPhone, body: msg.slice(0, 160) });
}
