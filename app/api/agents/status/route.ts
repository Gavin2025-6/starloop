import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [calls, followups, reputationLogs, winbackLogs, referralLogs] = await Promise.all([
      prisma.call.count({ where: { businessId: business.id, createdAt: { gte: todayStart } } }),
      prisma.agentLog.count({ where: { businessId: business.id, agent: "followup", createdAt: { gte: todayStart } } }),
      prisma.agentLog.count({ where: { businessId: business.id, agent: "reputation", createdAt: { gte: todayStart } } }),
      prisma.agentLog.count({ where: { businessId: business.id, agent: "winback", createdAt: { gte: todayStart } } }),
      prisma.agentLog.count({ where: { businessId: business.id, agent: "referral", createdAt: { gte: todayStart } } }),
    ]);

    return NextResponse.json({
      intake:     { count: calls,          label: "Intake" },
      followup:   { count: followups,      label: "Follow-up" },
      reputation: { count: reputationLogs, label: "Reputation" },
      winback:    { count: winbackLogs,    label: "Winback" },
      referral:   { count: referralLogs,   label: "Referral" },
    });
  } catch (err) {
    console.error("[agents/status]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
