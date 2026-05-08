import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/google";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en/auth/login`
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard/settings?google=error`
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

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard?google=connected`
    );
  } catch (err) {
    console.error("[Google/Callback]", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard/settings?google=error`
    );
  }
}
