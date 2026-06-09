import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AGENT_EMOJI: Record<string, string> = {
  intake: "📞",
  followup: "📬",
  reputation: "⭐",
  winback: "↩️",
  referral: "🤝",
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json([]);

    const logs = await prisma.agentLog.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(
      logs.map((l) => ({
        id: l.id,
        emoji: AGENT_EMOJI[l.agent] ?? "🤖",
        agent: l.agent,
        action: l.action,
        detail: l.detail,
        createdAt: l.createdAt,
      }))
    );
  } catch (err) {
    console.error("[agents/activity]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
