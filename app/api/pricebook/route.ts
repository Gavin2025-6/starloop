import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json([]);

    const items = await prisma.priceBookItem.findMany({
      where: { businessId: business.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error("[pricebook GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const { name, description, priceMin, priceMax, unit, sortOrder } = await req.json();
    if (!name || priceMin == null || priceMax == null) {
      return NextResponse.json({ error: "name, priceMin, priceMax required" }, { status: 400 });
    }

    const item = await prisma.priceBookItem.create({
      data: {
        businessId: business.id,
        name,
        description: description || null,
        priceMin: parseFloat(priceMin),
        priceMax: parseFloat(priceMax),
        unit: unit || "flat",
        sortOrder: sortOrder ?? 0,
      },
    });
    return NextResponse.json(item);
  } catch (err) {
    console.error("[pricebook POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
