/**
 * Single source of truth for Job status transitions.
 * EVERY status change in the app must call transitionJobStatus().
 * Direct DB writes to job.status are forbidden.
 */
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { runFollowup } from "@/lib/agents/followup-agent";
import { formatName } from "@/lib/utils";
import Stripe from "stripe";

export type JobStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "awaiting_payment"
  | "paid"
  | "partially_paid"
  | "cancelled"
  | "no_show";

export const LEGAL_TRANSITIONS: Record<string, JobStatus[]> = {
  scheduled:        ["in_progress", "cancelled", "no_show"],
  in_progress:      ["completed", "cancelled"],
  completed:        ["awaiting_payment", "paid", "partially_paid"],
  awaiting_payment: ["paid", "partially_paid"],
  partially_paid:   ["paid"],
  // cancelled, no_show, paid are terminal — no entries here
};

export interface TransitionMetadata {
  triggeredBy?: string;
  note?: string;
  finalAmount?: number;
  paidAmount?: number;
  cancelReason?: string;
  cancelledBy?: string;
  paymentMethod?: string;
  paymentIntentId?: string;
  stripeEventId?: string;
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

async function getPaymentLinkUrl(paymentLinkId: string): Promise<string | null> {
  try {
    const stripe = getStripe();
    if (!stripe) return null;
    const link = await stripe.paymentLinks.retrieve(paymentLinkId);
    return link.url;
  } catch {
    return null;
  }
}

export async function transitionJobStatus(
  jobId: string,
  toStatus: JobStatus,
  metadata: TransitionMetadata = {}
): Promise<Record<string, unknown>> {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { customer: true, business: true, payment: true, reviewStatus: true },
  });

  const fromStatus = job.status;

  // Idempotency: already in target state
  if (fromStatus === toStatus) {
    return job as unknown as Record<string, unknown>;
  }

  // Validate transition is legal
  const allowed = (LEGAL_TRANSITIONS[fromStatus] ?? []) as string[];
  if (!allowed.includes(toStatus)) {
    throw new Error(
      `Illegal transition: ${fromStatus} → ${toStatus}. Allowed from "${fromStatus}": [${allowed.join(", ") || "none — terminal state"}]`
    );
  }

  // Build DB update payload
  const updateData: Record<string, unknown> = { status: toStatus };

  if (toStatus === "in_progress") {
    updateData.actualStart = new Date();
  }

  if (toStatus === "completed") {
    updateData.actualEnd = new Date();
    updateData.completedAt = new Date();
    if (metadata.finalAmount !== undefined) {
      updateData.total = metadata.finalAmount;
      updateData.balanceAmount = metadata.finalAmount;
    } else {
      updateData.balanceAmount = job.total ?? 0;
    }
  }

  if (toStatus === "cancelled" || toStatus === "no_show") {
    if (metadata.cancelReason) updateData.cancelReason = metadata.cancelReason;
    if (metadata.cancelledBy) updateData.cancelledBy = metadata.cancelledBy;
  }

  if (toStatus === "paid") {
    const totalOwed = (job.total ?? 0) as number;
    const paid = metadata.paidAmount ?? totalOwed;
    updateData.paidAmount = paid;
    updateData.balanceAmount = 0;
    if (metadata.paymentMethod) updateData.paymentMethod = metadata.paymentMethod;
    // Schedule review request 30 minutes from now
    updateData.reviewRequestScheduledAt = new Date(Date.now() + 30 * 60 * 1000);
  }

  if (toStatus === "partially_paid") {
    const paidSoFar = metadata.paidAmount ?? 0;
    const totalOwed = (job.total ?? 0) as number;
    updateData.paidAmount = paidSoFar;
    updateData.balanceAmount = Math.max(0, totalOwed - paidSoFar);
  }

  // Apply update
  const updated = await prisma.job.update({
    where: { id: jobId },
    data: updateData,
    include: { customer: true, business: true, payment: true, reviewStatus: true },
  });

  // Write immutable audit entry
  await prisma.jobEvent.create({
    data: {
      jobId,
      type: "status_changed",
      fromStatus,
      toStatus,
      triggeredBy: metadata.triggeredBy ?? "system",
      note: metadata.note ?? null,
      payload: {
        from: fromStatus,
        to: toStatus,
        ...(metadata.cancelReason ? { cancelReason: metadata.cancelReason } : {}),
        ...(metadata.paidAmount !== undefined ? { paidAmount: metadata.paidAmount } : {}),
        ...(metadata.stripeEventId ? { stripeEventId: metadata.stripeEventId } : {}),
      },
    },
  });

  // Fire side-effects (non-fatal — log but don't throw)
  await runSideEffects(jobId, toStatus, updated, metadata).catch((err) => {
    console.error("[job-state-machine] side-effect error", { jobId, toStatus, err });
  });

  return updated as unknown as Record<string, unknown>;
}

async function runSideEffects(
  jobId: string,
  toStatus: JobStatus,
  job: {
    id: string;
    total: number;
    paidAmount: number;
    balanceAmount: number;
    serviceType: string;
    customerName: string | null;
    customerPhone: string | null;
    clientToken: string | null;
    customer: { name: string; phone: string | null };
    business: {
      id: string;
      name: string;
      slug: string;
      phone: string | null;
      stripeAccountId: string | null;
      stripeChargesEnabled: boolean;
      plan: string;
    };
    payment: { stripePaymentLinkId: string | null; id: string } | null;
  },
  metadata: TransitionMetadata
) {
  const customerPhone = job.customerPhone ?? job.customer.phone;
  const customerName = job.customerName ?? job.customer.name;
  const isTrial = process.env.TWILIO_MOCK === "1";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  switch (toStatus) {
    case "completed": {
      // Auto-generate Stripe payment link (stored, not sent yet)
      const totalAmount = job.total;
      if (job.business.stripeAccountId && totalAmount >= 0.5) {
        try {
          const stripe = getStripe();
          if (stripe) {
            const acct = await stripe.accounts.retrieve(job.business.stripeAccountId);
            if (acct.charges_enabled) {
              const amountCents = Math.round(totalAmount * 100);
              const appFeeCents = Math.ceil(amountCents * 0.01);

              const price = await stripe.prices.create({
                currency: "cad",
                unit_amount: amountCents,
                product_data: { name: `${job.serviceType} — ${job.business.name}` },
              });

              const paymentLink = await stripe.paymentLinks.create({
                line_items: [{ price: price.id, quantity: 1 }],
                application_fee_amount: appFeeCents,
                transfer_data: { destination: job.business.stripeAccountId },
                metadata: { jobId: job.id, businessId: job.business.id },
              });

              await prisma.payment.upsert({
                where: { jobId: job.id },
                create: {
                  jobId: job.id,
                  businessId: job.business.id,
                  stripePaymentLinkId: paymentLink.id,
                  amount: totalAmount,
                  applicationFee: appFeeCents / 100,
                  status: "pending",
                },
                update: {
                  stripePaymentLinkId: paymentLink.id,
                  amount: totalAmount,
                  applicationFee: appFeeCents / 100,
                  status: "pending",
                },
              });

              await prisma.jobEvent.create({
                data: {
                  jobId,
                  type: "payment_link_created",
                  payload: { amount: totalAmount, url: paymentLink.url },
                },
              });
            }
          }
        } catch (err) {
          console.error("[job-state-machine] payment link creation failed", err);
        }
      }
      break;
    }

    case "awaiting_payment": {
      const totalAmount = job.total;
      const clientHubUrl = job.clientToken && appUrl
        ? `${appUrl}/pay/${job.clientToken}`
        : null;

      if (customerPhone) {
        const fmtName = formatName(customerName);
        if (isTrial || !clientHubUrl) {
          await sendSms({
            to: customerPhone,
            body: `Hi ${fmtName}, job's done! Your total is $${totalAmount.toFixed(2)}. Pay here when you're ready — link coming soon. — ${job.business.name}`.slice(0, 160),
          }).catch(() => {});
          await prisma.jobEvent.create({
            data: {
              jobId,
              type: "sms_mocked",
              payload: { kind: "payment_link", reason: isTrial ? "trial_no_url" : "no_link" },
            },
          });
        } else {
          await sendSms({
            to: customerPhone,
            body: `Hi ${fmtName}, job's done! Your total is $${totalAmount.toFixed(2)}. Pay here when you're ready: ${clientHubUrl} — ${job.business.name}`.slice(0, 160),
          }).catch(() => {});
          await prisma.jobEvent.create({
            data: {
              jobId,
              type: "sms_sent",
              payload: { kind: "payment_link", amount: totalAmount, url: clientHubUrl },
            },
          });
        }
      }

      // Notify business owner
      if (job.business.phone) {
        await sendSms({
          to: job.business.phone,
          body: `Payment link sent to ${customerName} for $${totalAmount.toFixed(2)}.`,
        }).catch(() => {});
      }
      break;
    }

    case "partially_paid": {
      const balance = job.balanceAmount;
      const paid = job.paidAmount;

      // Create a new link for the remaining balance
      if (job.business.stripeAccountId && balance >= 0.5) {
        try {
          const stripe = getStripe();
          if (stripe) {
            const acct = await stripe.accounts.retrieve(job.business.stripeAccountId);
            if (acct.charges_enabled) {
              const amountCents = Math.round(balance * 100);
              const appFeeCents = Math.ceil(amountCents * 0.01);

              const price = await stripe.prices.create({
                currency: "cad",
                unit_amount: amountCents,
                product_data: {
                  name: `${job.serviceType} — Balance Due — ${job.business.name}`,
                },
              });

              const paymentLink = await stripe.paymentLinks.create({
                line_items: [{ price: price.id, quantity: 1 }],
                application_fee_amount: appFeeCents,
                transfer_data: { destination: job.business.stripeAccountId },
                metadata: { jobId: job.id, businessId: job.business.id, isBalance: "true" },
              });

              await prisma.payment.upsert({
                where: { jobId: job.id },
                create: {
                  jobId: job.id,
                  businessId: job.business.id,
                  stripePaymentLinkId: paymentLink.id,
                  amount: balance,
                  applicationFee: appFeeCents / 100,
                  status: "partial",
                },
                update: {
                  stripePaymentLinkId: paymentLink.id,
                  amount: balance,
                  status: "partial",
                },
              });

              if (customerPhone && !isTrial) {
                await sendSms({
                  to: customerPhone,
                  body: `Hi ${customerName}! We received $${paid.toFixed(2)}. Remaining balance: $${balance.toFixed(2)}. Pay here: ${paymentLink.url}`.slice(0, 160),
                }).catch(() => {});
                await prisma.jobEvent.create({
                  data: {
                    jobId,
                    type: "sms_sent",
                    payload: { kind: "payment_link", amount: balance, note: "balance_due" },
                  },
                });
              }
            }
          }
        } catch (err) {
          console.error("[job-state-machine] balance link creation failed", err);
        }
      }
      break;
    }

    case "paid": {
      // Mark Payment record as paid
      await prisma.payment.updateMany({
        where: { jobId },
        data: {
          status: "paid",
          paidAt: new Date(),
          ...(metadata.paymentIntentId
            ? { stripePaymentIntentId: metadata.paymentIntentId }
            : {}),
        },
      });

      // Idempotency: only trigger followup once
      const alreadySent = await prisma.jobEvent.findFirst({
        where: { jobId, type: "sms_sent", payload: { path: ["kind"], equals: "thank_you" } },
      });

      if (!alreadySent) {
        await runFollowup(jobId).catch((err) => {
          console.error("[job-state-machine] followup failed", err);
        });
      }
      break;
    }

    case "cancelled": {
      if (customerPhone) {
        const reason = metadata.cancelReason;
        const fmtName = formatName(customerName);
        const appUrl2 = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const bookingLink = appUrl2 ? `${appUrl2}/book/${job.business.slug}` : null;
        const rejectBody = bookingLink
          ? `Hi ${fmtName}, your ${job.serviceType} appointment has been cancelled${reason ? ` (${reason})` : ""}. Need to rebook? ${bookingLink}`.slice(0, 160)
          : `Hi ${fmtName}, your ${job.serviceType} appointment has been cancelled${reason ? ` (${reason})` : ""}. Feel free to reach out to rebook.`.slice(0, 160);
        await sendSms({
          to: customerPhone,
          body: rejectBody,
        }).catch(() => {});
        await prisma.jobEvent.create({
          data: {
            jobId,
            type: "sms_sent",
            payload: { kind: "cancellation", reason: reason ?? null },
          },
        });
      }
      break;
    }

    case "no_show":
      // No SMS — customer is unreachable by definition; just log
      break;
  }
}
