import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats } from "@/lib/revenue-engine";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business found" }, { status: 404 });

    const stats = await getDashboardStats(business.id);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[dashboard/stats]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
