import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeCampaign } from "@/lib/revenue-engine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.businessId !== business.id) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const result = await executeCampaign(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[campaigns/execute]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
