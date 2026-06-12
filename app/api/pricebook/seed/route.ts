import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SeedItem {
  name: string;
  description?: string;
  priceMin: number;
  priceMax: number;
  unit?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const { items }: { items: SeedItem[] } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    // Delete existing items and replace with confirmed list
    await prisma.priceBookItem.deleteMany({ where: { businessId: business.id } });

    const created = await prisma.priceBookItem.createMany({
      data: items.map((item, idx) => ({
        businessId: business.id,
        name: item.name,
        description: item.description || null,
        priceMin: parseFloat(String(item.priceMin)),
        priceMax: parseFloat(String(item.priceMax)),
        unit: item.unit || "flat",
        sortOrder: idx,
        isActive: true,
      })),
    });

    return NextResponse.json({ created: created.count });
  } catch (err) {
    console.error("[pricebook/seed]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
