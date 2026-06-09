import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeCustomers } from "@/lib/revenue-engine";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const result = await analyzeCustomers(business.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[customers/analyze]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
