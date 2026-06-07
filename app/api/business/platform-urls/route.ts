import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
      select: { id: true, platformUrls: true },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: business.platformUrls ?? {} });
  } catch (err) {
    console.error("[Business/PlatformUrls/GET]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { yelp, facebook, apple_maps, bbb, homestars, healthgrades, tripadvisor } = body;

    const platformUrls: Record<string, string> = {};
    if (yelp) platformUrls.yelp = yelp;
    if (facebook) platformUrls.facebook = facebook;
    if (apple_maps) platformUrls.apple_maps = apple_maps;
    if (bbb) platformUrls.bbb = bbb;
    if (homestars) platformUrls.homestars = homestars;
    if (healthgrades) platformUrls.healthgrades = healthgrades;
    if (tripadvisor) platformUrls.tripadvisor = tripadvisor;

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    await prisma.business.update({
      where: { id: business.id },
      data: { platformUrls },
    });

    return NextResponse.json({ success: true, data: platformUrls });
  } catch (err) {
    console.error("[Business/PlatformUrls/POST]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
