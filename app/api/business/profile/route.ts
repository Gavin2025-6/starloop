import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug, services, bookingUrl, headline, description, name, industry, phone, address, city, googleBusinessUrl } = await req.json();

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    // Update business core fields
    const updateData: Record<string, string | undefined> = {};
    if (name) updateData.name = name;
    if (industry) updateData.industry = industry;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (googleBusinessUrl !== undefined) updateData.googleBusinessUrl = googleBusinessUrl;
    if (slug) updateData.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const updated = await prisma.business.update({
      where: { id: business.id },
      data: updateData,
    });

    // Upsert public profile
    const profile = await prisma.publicProfile.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        services: services || null,
        bookingUrl: bookingUrl || null,
        headline: headline || null,
        description: description || null,
      },
      update: {
        services: services !== undefined ? services : undefined,
        bookingUrl: bookingUrl !== undefined ? bookingUrl : undefined,
        headline: headline !== undefined ? headline : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json({ business: updated, profile });
  } catch (err) {
    console.error("[business/profile]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: {
        profile: true,
        googleConnection: { select: { reviewUrl: true, locationId: true } },
      },
    });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    return NextResponse.json(business);
  } catch (err) {
    console.error("[business/profile GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
