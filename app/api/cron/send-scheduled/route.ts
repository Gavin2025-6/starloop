import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { phoneToE164 } from "@/lib/utils";

// Called by Railway cron: GET /api/cron/send-scheduled
// Set Railway cron schedule to: 0 * * * * (every hour)
export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find pending scheduled requests that are due
  const due = await prisma.reviewRequest.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
      sentAt: null,
    },
    include: {
      customer: true,
      business: true,
    },
    take: 50,
  });

  let sent = 0;
  let failed = 0;

  for (const req of due) {
    try {
      if (req.channel === "SMS" && req.customer.phone) {
        await sendSms({
          to: phoneToE164(req.customer.phone),
          body: req.messageBody ?? "",
        });
      } else if (req.channel === "EMAIL" && req.customer.email) {
        const { sendReviewRequestEmail } = await import("@/lib/resend");
        await sendReviewRequestEmail({
          to: req.customer.email,
          customerName: req.customer.name,
          businessName: req.business.name,
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/en/review/${req.token}`,
        });
      }

      await prisma.reviewRequest.update({
        where: { id: req.id },
        data: { status: "SENT", sentAt: now },
      });
      sent++;
    } catch (err) {
      console.error(`[cron] Failed to send request ${req.id}:`, err);
      await prisma.reviewRequest.update({
        where: { id: req.id },
        data: { status: "FAILED" },
      });
      failed++;
    }
  }

  return NextResponse.json({ processed: due.length, sent, failed });
}
