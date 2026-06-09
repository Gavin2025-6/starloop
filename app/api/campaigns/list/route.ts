import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json([]);

    const campaigns = await prisma.campaign.findMany({
      where: { businessId: business.id },
      include: { _count: { select: { results: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      campaigns.map((c) => ({ ...c, _resultCount: c._count.results }))
    );
  } catch (err) {
    console.error("[campaigns/list]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
