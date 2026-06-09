import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const { type = "winback", targetSegment = "at-risk", scheduledAt } = await req.json();

    const statusFilter = targetSegment === "at-risk" ? ["at-risk"] : targetSegment === "lost" ? ["lost"] : ["at-risk", "lost"];
    const eligibleCount = await prisma.customer.count({
      where: { businessId: business.id, status: { in: statusFilter } },
    });

    const campaign = await prisma.campaign.create({
      data: {
        businessId: business.id,
        type,
        targetSegment,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return NextResponse.json({ ...campaign, eligibleCustomers: eligibleCount });
  } catch (err) {
    console.error("[campaigns/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
