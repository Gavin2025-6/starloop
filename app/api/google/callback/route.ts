import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/google";
import { discoverAndSaveLocation } from "@/lib/google/client";

export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(`${appUrl}/auth/login`);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");

    if (oauthError || !code) {
      console.error("[Google/Callback] OAuth error or missing code:", oauthError);
      return NextResponse.redirect(`${appUrl}/dashboard/reviews?connected=error`);
    }

    const tokens = await exchangeCodeForTokens(code);

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
      select: { id: true, autoConfirmBooking: true },
    });

    if (!business) {
      console.error("[Google/Callback] No business found for user:", session.user.id);
      return NextResponse.redirect(`${appUrl}/dashboard/reviews?connected=error`);
    }

    // Upsert GoogleBusinessConnection
    await prisma.googleBusinessConnection.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        accessToken: tokens.access_token ?? "",
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        // placeId, locationId, reviewUrl can be set separately after location selection
      },
      update: {
        accessToken: tokens.access_token ?? "",
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    });

    // Auto-discover account/location in the background
    discoverAndSaveLocation(business.id).catch((e) =>
      console.error("[Google/Callback] discoverAndSaveLocation failed:", e)
    );

    return NextResponse.redirect(`${appUrl}/dashboard/reviews?connected=true`);
  } catch (err) {
    console.error("[Google/Callback]", err);
    return NextResponse.redirect(`${appUrl}/dashboard/reviews?connected=error`);
  }
}
