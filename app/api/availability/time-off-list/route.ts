import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json([]);

    const timeOffs = await prisma.timeOff.findMany({
      where: { businessId: business.id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(timeOffs);
  } catch (err) {
    console.error("[time-off-list/GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
