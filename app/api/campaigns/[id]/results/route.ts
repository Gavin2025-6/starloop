import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        results: {
          include: { customer: true },
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!campaign || campaign.businessId !== business.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (err) {
    console.error("[campaigns/results]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
