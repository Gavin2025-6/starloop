import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        priceBookItems: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        phone: business.phone ?? null,
        industry: business.industry,
        bookingWeekendEnabled: business.bookingWeekendEnabled,
      },
      priceBookItems: business.priceBookItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        priceMin: Number(item.priceMin),
        priceMax: Number(item.priceMax),
        unit: item.unit,
      })),
    });
  } catch (err) {
    console.error("[public/booking/slug]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
