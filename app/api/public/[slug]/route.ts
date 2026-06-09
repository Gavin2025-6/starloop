import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const business = await prisma.business.findUnique({
      where: { slug },
      include: { profile: true },
    });

    if (!business || !business.profile?.isPublished) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.publicProfile.update({
      where: { businessId: business.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      business: {
        name: business.name,
        industry: business.industry,
        city: business.city,
        slug: business.slug,
      },
      profile: business.profile,
    });
  } catch (err) {
    console.error("[public/slug]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
