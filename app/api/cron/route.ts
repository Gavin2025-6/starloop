import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { getResend } from "@/lib/resend";

function buildReviewEmailHtml(job: {
  serviceType: string;
  customerName: string | null;
  customer: { name: string; email: string | null };
  business: { name: string; city: string | null; province: string | null };
}, trackingUrl: string): string {
  const name = job.customerName ?? job.customer.name;
  const location = [job.business.city, job.business.province].filter(Boolean).join(", ");
  return `
    <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:auto;padding:32px 24px">
      <h2 style="color:#0D1117;margin:0 0 4px">${job.business.name}</h2>
      ${location ? `<p style="color:#6B7280;margin:0 0 24px;font-size:14px">${location}</p>` : ""}
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 24px"/>
      <p style="color:#374151;margin:0 0 12px">Hi ${name},</p>
      <p style="color:#374151;margin:0 0 12px">
        Thank you for choosing <strong>${job.business.name}</strong> for your
        ${job.serviceType}. We hope everything went great!
      </p>
      <p style="color:#374151;margin:0 0 28px">
        If you have 30 seconds, a Google review makes a huge difference for our small business:
      </p>
      <div style="text-align:center;margin:0 0 32px">
        <a href="${trackingUrl}"
           style="display:inline-block;background:#10B981;color:#fff;font-weight:700;
                  font-size:16px;padding:14px 36px;border-radius:10px;text-decoration:none">
          ⭐ Leave a Google Review
        </a>
      </div>
      <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0">
        You received this because you recently used ${job.business.name}.<br/>
        No action needed — this is a one-time message.
      </p>
    </div>
  `;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { reviewsSent: 0, remindersSent: 0, errors: [] as string[] };
  const isTrial = process.env.TWILIO_MOCK === "1";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  try {
    // ── JOB 1: Initial review request (30 min after PAID, not yet sent) ────────
    const needsReview = await prisma.job.findMany({
      where: {
        status: "paid",
        reviewRequestScheduledAt: { lte: now },
        reviewRequestSentAt: null,
      },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        business: { select: { name: true, city: true, province: true, googleReviewUrl: true } },
      },
    });

    for (const job of needsReview) {
      try {
        const name = job.customerName ?? job.customer.name;
        const phone = job.customerPhone ?? job.customer.phone;
        const email = job.customer.email;
        const trackingUrl = job.clientToken && appUrl
          ? `${appUrl}/api/review-click/${job.clientToken}`
          : job.business.googleReviewUrl ?? null;

        if (!trackingUrl) {
          results.errors.push(`Job ${job.id}: no review URL available`);
          continue;
        }

        // SMS
        if (phone) {
          const smsBody = isTrial
            ? `Hi ${name}! Thanks for choosing ${job.business.name}. A quick Google review would mean a lot. Thank you!`
            : `Hi ${name}! Thanks for choosing ${job.business.name}. If you're happy with your service, a quick Google review would mean a lot: ${trackingUrl}\nReply STOP to opt out.`.slice(0, 160);
          await sendSms({ to: phone, body: smsBody }).catch(e =>
            results.errors.push(`SMS ${job.id}: ${e.message}`)
          );
        }

        // Email
        if (email) {
          try {
            const resend = getResend();
            await resend.emails.send({
              from: `${job.business.name} <reviews@servicestar.app>`,
              to: email,
              subject: `How was your experience with ${job.business.name}?`,
              html: buildReviewEmailHtml(job, trackingUrl),
            });
          } catch (e: unknown) {
            results.errors.push(`Email ${job.id}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }

        await prisma.job.update({
          where: { id: job.id },
          data: { reviewRequestSentAt: now },
        });

        await prisma.jobEvent.create({
          data: {
            jobId: job.id,
            type: "review_request_sent",
            payload: { smsSent: !!phone, emailSent: !!email },
          },
        });

        results.reviewsSent++;
      } catch (e: unknown) {
        results.errors.push(`Job ${job.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // ── JOB 2: 48-hour reminder (sent but not clicked, no reminder yet) ─────────
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const needsReminder = await prisma.job.findMany({
      where: {
        status: "paid",
        reviewRequestSentAt: { lte: fortyEightHoursAgo },
        reviewClicked: false,
        reviewReminderSentAt: null,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        business: { select: { name: true, googleReviewUrl: true } },
      },
    });

    for (const job of needsReminder) {
      try {
        const name = job.customerName ?? job.customer.name;
        const phone = job.customerPhone ?? job.customer.phone;
        const trackingUrl = job.clientToken && appUrl
          ? `${appUrl}/api/review-click/${job.clientToken}?via=reminder`
          : job.business.googleReviewUrl ?? null;

        if (phone && trackingUrl) {
          const body = isTrial
            ? `Hi ${name}, just a reminder — a Google review for ${job.business.name} would really help! Thank you.`
            : `Hi ${name}, just a reminder — your Google review for ${job.business.name} would really help: ${trackingUrl}\nReply STOP to opt out.`.slice(0, 160);
          await sendSms({ to: phone, body }).catch(e =>
            results.errors.push(`Reminder SMS ${job.id}: ${e.message}`)
          );
        }

        await prisma.job.update({
          where: { id: job.id },
          data: { reviewReminderSentAt: now },
        });

        results.remindersSent++;
      } catch (e: unknown) {
        results.errors.push(`Reminder ${job.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (err) {
    console.error("[cron]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    ...results,
  });
}
