import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface PlatformInfo {
  name: string;
  connected: boolean;
  reviewCount: number;
  avgRating: number | null;
  url: string | null;
  valueProposition: string;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    const business = await prisma.business.findFirst({
      where: businessId
        ? { id: businessId, userId: session.user.id }
        : { userId: session.user.id },
      include: {
        reviews: { select: { rating: true, platform: true } },
        _count: { select: { reviews: true } },
      },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    const platformUrls = (business.platformUrls as Record<string, string> | null) ?? {};

    // Google data from DB
    const googleReviews = business.reviews.filter((r) => r.platform === "GOOGLE");
    const googleAvg =
      googleReviews.length > 0
        ? Number(
            (googleReviews.reduce((s, r) => s + r.rating, 0) / googleReviews.length).toFixed(1)
          )
        : null;

    const VALUE_PROPS: Record<string, string> = {
      google:
        "Primary platform for local search. 87% of consumers read Google reviews before visiting.",
      yelp: "Essential for restaurants and home services. Strong in urban markets.",
      facebook:
        "Social proof for your existing community. Shares amplify your reach.",
      apple_maps:
        "Apple Maps reviews doubled in 2026. iPhone users' top choice for local search.",
      bbb: "BBB accreditation is one of the most trusted business endorsements in North America.",
      homestars:
        "Canada's #1 platform for home service providers. Essential in GTA and major cities.",
      healthgrades:
        "Critical for health and wellness businesses. Patients check before booking.",
      tripadvisor:
        "Reaches international visitors and food lovers. Key for restaurants and hospitality.",
    };

    const platforms: Record<string, PlatformInfo> = {
      google: {
        name: "Google",
        connected: business.isGoogleConnected,
        reviewCount: googleReviews.length,
        avgRating: googleAvg,
        url: business.googleReviewUrl,
        valueProposition: VALUE_PROPS.google,
      },
      yelp: {
        name: "Yelp",
        connected: !!platformUrls.yelp,
        reviewCount: 0,
        avgRating: null,
        url: platformUrls.yelp ?? null,
        valueProposition: VALUE_PROPS.yelp,
      },
      facebook: {
        name: "Facebook",
        connected: !!platformUrls.facebook,
        reviewCount: 0,
        avgRating: null,
        url: platformUrls.facebook ?? null,
        valueProposition: VALUE_PROPS.facebook,
      },
      apple_maps: {
        name: "Apple Maps",
        connected: !!platformUrls.apple_maps,
        reviewCount: 0,
        avgRating: null,
        url: platformUrls.apple_maps ?? null,
        valueProposition: VALUE_PROPS.apple_maps,
      },
      bbb: {
        name: "BBB",
        connected: !!platformUrls.bbb,
        reviewCount: 0,
        avgRating: null,
        url: platformUrls.bbb ?? null,
        valueProposition: VALUE_PROPS.bbb,
      },
      homestars: {
        name: "HomeStars",
        connected: !!platformUrls.homestars,
        reviewCount: 0,
        avgRating: null,
        url: platformUrls.homestars ?? null,
        valueProposition: VALUE_PROPS.homestars,
      },
      healthgrades: {
        name: "Healthgrades",
        connected: !!platformUrls.healthgrades,
        reviewCount: 0,
        avgRating: null,
        url: platformUrls.healthgrades ?? null,
        valueProposition: VALUE_PROPS.healthgrades,
      },
      tripadvisor: {
        name: "TripAdvisor",
        connected: !!platformUrls.tripadvisor,
        reviewCount: 0,
        avgRating: null,
        url: platformUrls.tripadvisor ?? null,
        valueProposition: VALUE_PROPS.tripadvisor,
      },
    };

    const connectedCount = Object.values(platforms).filter((p) => p.connected).length;
    const totalReviews = googleReviews.length;
    const overallAvg = googleAvg;

    return NextResponse.json({
      success: true,
      data: {
        businessId: business.id,
        totalReviews,
        overallAvgRating: overallAvg,
        connectedCount,
        totalPlatforms: 8,
        platforms,
      },
    });
  } catch (err) {
    console.error("[Reviews/Platforms]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
