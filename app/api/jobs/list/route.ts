import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json([]);

    const status = req.nextUrl.searchParams.get("status");
    const jobs = await prisma.job.findMany({
      where: { businessId: business.id, ...(status ? { status } : {}) },
      include: {
        customer: { select: { name: true, phone: true } },
        invoice: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (err) {
    console.error("[jobs/list]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
