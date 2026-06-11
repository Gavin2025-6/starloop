import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const { name, phone, email, lastServiceDate, totalSpend, notes } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name,
        phone: phone || null,
        email: email || null,
        lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
        totalSpend: totalSpend ? parseFloat(totalSpend) : 0,
        notes: notes || null,
      },
    });

    return NextResponse.json(customer);
  } catch (err) {
    console.error("[customers/add]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
