import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/google";
import { getToken } from "next-auth/jwt";

function detectLocale(req: Request): string {
  const acceptLang = req.headers.get("accept-language") ?? "";
  if (/\bzh[-_]/i.test(acceptLang) || /\bzh\b/i.test(acceptLang)) return "zh-CN";
  return "en";
}

export async function GET(request: Request) {
  const locale = detectLocale(request);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  console.log("[Google/Callback] ▶ Start — locale:", locale, "url:", request.url.split("?")[0]);

  const session = await auth();
  if (!session?.user?.id) {
    console.log("[Google/Callback] ✗ No session — redirecting to login");
    return NextResponse.redirect(`${appUrl}/en/auth/login`);
  }
  console.log("[Google/Callback] ✓ Session userId:", session.user.id);

  const jwtToken = await getToken({
    req: request as Parameters<typeof getToken>[0]["req"],
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  const onboardingCompleted = jwtToken?.onboardingCompleted ?? false;
  console.log("[Google/Callback] onboardingCompleted:", onboardingCompleted);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  if (oauthError || !code) {
    console.log("[Google/Callback] ✗ OAuth error or missing code:", oauthError);
    return NextResponse.redirect(`${appUrl}/en/connect-google?error=true`);
  }
  console.log("[Google/Callback] ✓ Code received, exchanging for tokens…");

  try {
    const tokens = await exchangeCodeForTokens(code);
    console.log("[Google/Callback] ✓ Tokens received — access_token present:", !!tokens.access_token, "refresh_token present:", !!tokens.refresh_token);

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
      select: { id: true, isGoogleConnected: true },
    });
    console.log("[Google/Callback] Business found:", business?.id ?? "none", "currently isGoogleConnected:", business?.isGoogleConnected ?? "n/a");

    if (!business) {
      await prisma.business.create({
        data: {
          userId: session.user.id,
          name: session.user.name ?? "My Business",
          isGoogleConnected: true,
          googleAccessToken: tokens.access_token ?? undefined,
          googleRefreshToken: tokens.refresh_token ?? undefined,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
      });
      console.log("[Google/Callback] ✓ Business CREATED with isGoogleConnected=true");
    } else {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          isGoogleConnected: true,
          googleAccessToken: tokens.access_token ?? undefined,
          googleRefreshToken: tokens.refresh_token ?? undefined,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
      });
      console.log("[Google/Callback] ✓ Business UPDATED — isGoogleConnected=true for id:", business.id);
    }

    // Verify DB write succeeded
    const verify = await prisma.business.findFirst({
      where: { userId: session.user.id },
      select: { isGoogleConnected: true },
    });
    console.log("[Google/Callback] ✓ DB verify — isGoogleConnected:", verify?.isGoogleConnected);

    // Always redirect to /en/onboarding?step=3 for onboarding users.
    // Hardcode /en to avoid zh-CN locale routing issues with the step param.
    const redirectTo = onboardingCompleted
      ? `${appUrl}/en/dashboard`
      : `${appUrl}/en/onboarding?step=3`;

    console.log("[Google/Callback] ✓ Redirecting to:", redirectTo);

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
    console.error("[Google/Callback] ✗ Exception:", err);
    return NextResponse.redirect(`${appUrl}/en/connect-google?error=true`);
  }
}
