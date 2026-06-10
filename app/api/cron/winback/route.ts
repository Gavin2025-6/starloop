import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = req.headers.get("x-cron-secret");
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    let sent = 0;

    const businesses = await prisma.business.findMany({
      select: { id: true, name: true, phone: true, slug: true, plan: true },
    });

    for (const business of businesses) {
      // Find qualifying customers:
      // - status = active
      // - no Job created in last 30 days
      // - lastFollowupAt < 30 days ago OR null
      const customers = await prisma.customer.findMany({
        where: {
          businessId: business.id,
          status: "active",
          OR: [
            { lastFollowupAt: null },
            { lastFollowupAt: { lt: thirtyDaysAgo } },
          ],
          jobs: {
            none: {
              createdAt: { gt: thirtyDaysAgo },
            },
          },
        },
      });

      for (const customer of customers) {
        if (!customer.phone) continue;

        const isPaid = business.plan !== "free" && business.plan !== "trial";

        let msg: string;
        if (isPaid) {
          msg = `Hi ${customer.name}! ${business.name} misses you. Book now: ${appUrl}/b/${business.slug}`;
        } else {
          msg = `Hi ${customer.name}! It's been a while. ${business.name} would love to serve you again. Call: ${business.phone ?? "us"}`;
        }

        await sendSms({ to: customer.phone, body: msg }).catch(() => {});

        await prisma.customer.update({
          where: { id: customer.id },
          data: { lastFollowupAt: new Date() },
        });

        await prisma.agentLog.create({
          data: {
            businessId: business.id,
            agent: "winback",
            action: "winback sent",
            customerId: customer.id,
          },
        });

        sent++;
      }
    }

    return NextResponse.json({ sent });
  } catch (err) {
    console.error("[cron/winback]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
