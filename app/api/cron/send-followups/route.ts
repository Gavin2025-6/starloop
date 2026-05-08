import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms, buildFollowUpMessage } from "@/lib/twilio";
import { getGoogleReviewUrl, phoneToE164 } from "@/lib/utils";

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.reviewRequest.findMany({
    where: {
      status: "SENT",
      followUpCount: { lt: 2 },
      nextFollowUpAt: { lte: now },
    },
    include: {
      customer: true,
      business: { include: { user: true } },
    },
  });

  let sent = 0;
  for (const req of due) {
    if (!req.customer.phone) continue;

    const reviewUrl = req.business.googleBusinessId
      ? getGoogleReviewUrl(req.business.googleBusinessId)
      : `${process.env.NEXT_PUBLIC_APP_URL}/review/${req.businessId}`;

    const language =
      (req.business.user.preferredLanguage as "en" | "zh-CN") ?? "en";

    const body = buildFollowUpMessage({
      businessName: req.business.name,
      customerName: req.customer.name,
      reviewUrl,
      language,
    });

    try {
      await sendSms({ to: phoneToE164(req.customer.phone), body });

      // Max 2 follow-ups, spaced 3 days apart
      const nextCount = req.followUpCount + 1;
      await prisma.reviewRequest.update({
        where: { id: req.id },
        data: {
          followUpCount: nextCount,
          nextFollowUpAt:
            nextCount < 2
              ? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
              : null,
        },
      });
      sent++;
    } catch (err) {
      console.error(`[Cron/FollowUp] request ${req.id}:`, err);
    }
  }

  console.log(`[Cron/FollowUp] sent:${sent}/${due.length}`);
  return NextResponse.json({ ok: true, sent });
}
