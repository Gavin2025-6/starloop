import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const segment = req.nextUrl.searchParams.get("segment") ?? "at-risk";
    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ count: 0 });

    const statusFilter =
      segment === "at-risk" ? ["at-risk"]
      : segment === "lost" ? ["lost"]
      : ["at-risk", "lost"];

    const count = await prisma.customer.count({
      where: { businessId: business.id, status: { in: statusFilter } },
    });

    return NextResponse.json({ count });
  } catch (err) {
    console.error("[customers/count]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
