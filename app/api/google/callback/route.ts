import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/google";
import { getToken } from "next-auth/jwt";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en/auth/login`
    );
  }

  // Check if user has completed onboarding to decide where to redirect
  const jwtToken = await getToken({
    req: request as Parameters<typeof getToken>[0]["req"],
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  const onboardingCompleted = jwtToken?.onboardingCompleted ?? false;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en/connect-google?error=true`
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      // Create a default business
      await prisma.business.create({
        data: {
          userId: session.user.id!,
          name: session.user.name ?? "My Business",
          isGoogleConnected: true,
          googleAccessToken: tokens.access_token ?? undefined,
          googleRefreshToken: tokens.refresh_token ?? undefined,
          googleTokenExpiry: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
        },
      });
    } else {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          isGoogleConnected: true,
          googleAccessToken: tokens.access_token ?? undefined,
          googleRefreshToken: tokens.refresh_token ?? undefined,
          googleTokenExpiry: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
        },
      });
    }

    // During onboarding, go back to step 3; otherwise go to dashboard
    const redirectTo = onboardingCompleted
      ? `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard?tour=true`
      : `${process.env.NEXT_PUBLIC_APP_URL}/en/onboarding?step=3`;

    const response = NextResponse.redirect(redirectTo);
    response.cookies.set("starloop_google_connected", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    console.error("[Google/Callback]", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en/connect-google?error=true`
    );
  }
}
