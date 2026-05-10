import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await prisma.business.findFirst({ where: { userId: session.user.id } });
  if (!business) return NextResponse.json([]);

  const reports = await prisma.reputationReport.findMany({
    where: { businessId: business.id },
    orderBy: { month: "desc" },
  });

  return NextResponse.json(reports);
}
