import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { getResend } from "@/lib/resend";
import { formatName } from "@/lib/utils";

// Called every 5 minutes — finds PAID jobs ready for review request
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const isTrial = process.env.TWILIO_MOCK === "1";
  const now = new Date();

  try {
    // 1. Initial review request: PAID, scheduled time passed, not yet sent
    const readyForReview = await prisma.job.findMany({
      where: {
        status: "paid",
        reviewRequestScheduledAt: { lte: now },
        reviewRequestSentAt: null,
      },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        business: { select: { name: true, phone: true, googleBusinessUrl: true } },
        reviewStatus: true,
      },
    });

    for (const job of readyForReview) {
      const name = formatName(job.customerName ?? job.customer.name);
      const phone = job.customerPhone ?? job.customer.phone;
      const email = job.customer.email;
      const googleUrl = job.business.googleBusinessUrl;
      const reviewToken = job.clientToken;

      let smsSent = false;
      let emailSent = false;

      if (googleUrl && reviewToken) {
        const reviewClickUrl = appUrl ? `${appUrl}/api/review-click/${reviewToken}?via=sms` : null;

        // Send SMS
        if (phone) {
          const smsBody = reviewClickUrl && !isTrial
            ? `Hi ${name}, thanks for having us today. If you have a moment, we'd love to hear what you thought: ${reviewClickUrl} — ${job.business.name}`.slice(0, 160)
            : `Hi ${name}, thanks for having us today. If you have a moment, we'd love to hear what you thought — ${job.business.name}`.slice(0, 160);

          await sendSms({ to: phone, body: smsBody }).catch(err =>
            console.error("[review-requests] SMS failed", job.id, err)
          );
          smsSent = true;
        }

        // Send email
        if (email) {
          try {
            const resend = getResend();
            const emailClickUrl = appUrl ? `${appUrl}/api/review-click/${reviewToken}?via=email` : googleUrl;
            await resend.emails.send({
              from: "ServiceStar <noreply@servicestar.app>",
              to: email,
              subject: `How was your ${job.serviceType} with ${job.business.name}?`,
              html: `
                <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
                  <h2 style="color:#0D1117">${job.business.name}</h2>
                  <p style="color:#374151">Hi ${name},</p>
                  <p style="color:#374151">Thank you for choosing us for your ${job.serviceType}. We hope everything went well!</p>
                  <p style="color:#374151">If you have a moment, we'd love to hear about your experience:</p>
                  <div style="text-align:center;margin:28px 0">
                    <a href="${emailClickUrl}" style="display:inline-block;background:#10B981;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:10px;text-decoration:none">
                      ⭐ Leave a Google Review
                    </a>
                  </div>
                  <p style="color:#6B7280;font-size:13px">Thank you — it means a lot to our small business.</p>
                  <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0"/>
                  <p style="color:#9CA3AF;font-size:12px;text-align:center">
                    You're receiving this because you recently used ${job.business.name}.
                  </p>
                </div>
              `,
            });
            emailSent = true;
          } catch (emailErr) {
            console.error("[review-requests] email failed", job.id, emailErr);
          }
        }
      }

      // Mark as sent + upsert JobReviewStatus
      await prisma.job.update({
        where: { id: job.id },
        data: { reviewRequestSentAt: now },
      });

      await prisma.jobReviewStatus.upsert({
        where: { jobId: job.id },
        create: { jobId: job.id, smsSent, emailSent },
        update: { smsSent, emailSent },
      });

      await prisma.jobEvent.create({
        data: {
          jobId: job.id,
          type: "review_request_sent",
          payload: { smsSent, emailSent },
        },
      });
    }

    // 2. 48-hour reminder: review not clicked, reminder not yet sent
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const needsReminder = await prisma.job.findMany({
      where: {
        status: "paid",
        reviewRequestSentAt: { lte: cutoff48h },
        reviewClicked: false,
        reviewStatus: { reminderSentAt: null },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        business: { select: { name: true, googleBusinessUrl: true } },
        reviewStatus: true,
      },
    });

    for (const job of needsReminder) {
      if (!job.business.googleBusinessUrl) continue;
      const name = formatName(job.customerName ?? job.customer.name);
      const phone = job.customerPhone ?? job.customer.phone;
      const reviewToken = job.clientToken;

      if (phone) {
        const reviewClickUrl = reviewToken && appUrl && !isTrial
          ? `${appUrl}/api/review-click/${reviewToken}?via=sms_reminder`
          : null;

        const body = reviewClickUrl
          ? `Hi ${name}, just a reminder — we'd love to hear what you thought: ${reviewClickUrl} — ${job.business.name}`.slice(0, 160)
          : `Hi ${name}, just a reminder — if you have a moment, we'd love to hear how your service went. — ${job.business.name}`.slice(0, 160);

        await sendSms({ to: phone, body }).catch(err =>
          console.error("[review-requests] reminder SMS failed", job.id, err)
        );
      }

      if (job.reviewStatus) {
        await prisma.jobReviewStatus.update({
          where: { jobId: job.id },
          data: { reminderSentAt: now },
        });
      }

      await prisma.jobEvent.create({
        data: {
          jobId: job.id,
          type: "review_reminder_sent",
          payload: { via: "sms" },
        },
      });
    }

    return NextResponse.json({
      reviewed: readyForReview.length,
      reminded: needsReminder.length,
    });
  } catch (err) {
    console.error("[cron/review-requests]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
