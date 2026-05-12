import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, name, phone, email } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business || business.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const customer = await prisma.customer.create({
      data: { businessId, name, phone: phone || null, email: email || null },
    });

    return NextResponse.json(customer);
  } catch (err) {
    console.error("[Customers/POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
