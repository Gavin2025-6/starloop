import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendLowCreditAlert,
  sendGoogleDisconnectedAlert,
  sendInactiveSummaryEmail,
} from "@/lib/resend";

// GET /api/cron/alerts — run daily via Railway cron
// Checks: low SMS credits, Google disconnected, 30-day inactive users
export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { lowCredit: 0, googleDisconnected: 0, inactive: 0, errors: 0 };

  // ── 1. Low credit alerts (< 20 SMS) ───────────────────────────────────────
  try {
    const lowCreditUsers = await prisma.user.findMany({
      where: { smsCredits: { gt: 0, lt: 20 } },
      select: { id: true, email: true, name: true, smsCredits: true },
    });

    for (const user of lowCreditUsers) {
      try {
        await sendLowCreditAlert({
          to: user.email,
          name: user.name ?? user.email.split("@")[0],
          remainingCredits: user.smsCredits,
        });
        results.lowCredit++;
      } catch (e) {
        console.error("[Cron/Alerts] lowCredit email failed:", e);
        results.errors++;
      }
    }
  } catch (e) {
    console.error("[Cron/Alerts] lowCredit query failed:", e);
    results.errors++;
  }

  // ── 2. Google disconnected alerts ──────────────────────────────────────────
  try {
    const disconnectedBusinesses = await prisma.business.findMany({
      where: {
        isGoogleConnected: false,
        googleAccessToken: { not: null }, // Was connected before
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    for (const biz of disconnectedBusinesses) {
      try {
        await sendGoogleDisconnectedAlert({
          to: biz.user.email,
          name: biz.user.name ?? biz.user.email.split("@")[0],
          businessName: biz.name,
        });
        results.googleDisconnected++;
      } catch (e) {
        console.error("[Cron/Alerts] googleDisconnected email failed:", e);
        results.errors++;
      }
    }
  } catch (e) {
    console.error("[Cron/Alerts] googleDisconnected query failed:", e);
    results.errors++;
  }

  // ── 3. 30-day inactive users ───────────────────────────────────────────────
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const inactiveUsers = await prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        OR: [
          { lastLoginAt: { lt: thirtyDaysAgo } },
          { lastLoginAt: null, createdAt: { lt: thirtyDaysAgo } },
        ],
      },
      include: {
        businesses: {
          include: {
            reviews: {
              where: { createdAt: { gte: thirtyDaysAgo } },
              select: { rating: true },
            },
            reviewRequests: {
              where: { status: "PENDING" },
              select: { id: true },
            },
          },
          take: 1,
        },
      },
    });

    for (const user of inactiveUsers) {
      const biz = user.businesses[0];
      if (!biz) continue;

      const reviews = biz.reviews;
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      try {
        await sendInactiveSummaryEmail({
          to: user.email,
          name: user.name ?? user.email.split("@")[0],
          businessName: biz.name,
          reviewCount: reviews.length,
          avgRating,
          pendingRequests: biz.reviewRequests.length,
        });
        results.inactive++;
      } catch (e) {
        console.error("[Cron/Alerts] inactive email failed:", e);
        results.errors++;
      }
    }
  } catch (e) {
    console.error("[Cron/Alerts] inactive query failed:", e);
    results.errors++;
  }

  console.log("[Cron/Alerts] Done:", results);
  return NextResponse.json({ ok: true, ...results });
}
