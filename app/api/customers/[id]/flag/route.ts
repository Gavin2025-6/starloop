import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { isHighRisk, requiresDeposit } = await req.json();

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const customer = await prisma.customer.findUnique({ where: { id, businessId: business.id } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(isHighRisk !== undefined ? { isHighRisk } : {}),
        ...(requiresDeposit !== undefined ? { requiresDeposit } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[customers/flag]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
