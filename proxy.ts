// next-intl i18n routing — runs as Next.js proxy (renamed from middleware)
// Auto-detects browser language (Accept-Language header) via next-intl localeDetection.
// Default locale is "en". Chinese browsers are served "zh-CN" automatically.
// No manual language switcher — detection is fully automatic.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const handleI18nRouting = createMiddleware(routing);

/** Detect locale from Accept-Language header (used in custom redirects). */
function detectLocale(request: NextRequest): string {
  const acceptLang = request.headers.get("accept-language") ?? "";
  if (/\bzh[-_]/i.test(acceptLang) || /\bzh\b/i.test(acceptLang)) return "zh-CN";
  return "en";
}

/**
 * Strip the locale prefix (/en or /zh-CN) from a pathname so whitelist
 * checks work uniformly regardless of which locale the user is browsing in.
 */
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|zh-CN)/, "") || "/";
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const stripped = stripLocale(pathname);

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  const locale = detectLocale(request);

  // ── Email-verification whitelist ─────────────────────────────────────────
  // These paths are accessible even before the user's email is verified.
  const emailVerifyWhitelist = [
    "/auth/",
    "/api/",
    "/r/",
    "/review/",
    "/_next",
    "/favicon",
    "/widget",
  ];

  const isEmailVerifyWhitelisted =
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/zh-CN" ||
    emailVerifyWhitelist.some((p) => stripped.startsWith(p) || stripped === p);

  // Enforce email verification before all other guards
  if (token && !isEmailVerifyWhitelisted && token.isEmailVerified === false) {
    return NextResponse.redirect(new URL(`/${locale}/auth/verify-email`, request.url));
  }

  // ── Onboarding whitelist ─────────────────────────────────────────────────
  // These paths can be accessed before onboarding is complete.
  const onboardingWhitelist = [
    "/auth/",
    "/connect-google",
    "/onboarding",
    "/api/",
    "/r/",
    "/review/",
    "/_next",
    "/favicon",
    "/widget",
  ];

  const isOnboardingWhitelisted =
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/zh-CN" ||
    onboardingWhitelist.some(
      (p) => stripped.startsWith(p) || stripped === p
    );

  // Enforce 5-step onboarding before allowing dashboard access
  if (token && !isOnboardingWhitelisted && token.onboardingCompleted === false) {
    return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
  }

  // ── Google Business whitelist ────────────────────────────────────────────
  // These paths are accessible even without Google Business connected.
  // Billing and Settings remain accessible so users can top up credits or
  // manage account settings before (or after) connecting Google.
  const googleWhitelist = [
    ...onboardingWhitelist,
    "/dashboard/billing",
    "/dashboard/settings",
  ];

  const isGoogleWhitelisted =
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/zh-CN" ||
    googleWhitelist.some(
      (p) => stripped.startsWith(p) || stripped === p
    );

  const hasGoogleConnectedCookie =
    request.cookies.get("starloop_google_connected")?.value === "1";

  // Enforce Google Business connection for all dashboard pages except the whitelist above
  if (
    token &&
    !isGoogleWhitelisted &&
    token.isGoogleConnected === false &&
    !hasGoogleConnectedCookie
  ) {
    return NextResponse.redirect(new URL(`/${locale}/connect-google`, request.url));
  }

  const response = handleI18nRouting(request);

  // Railway reverse proxy: container runs on port 8080 internally but is
  // exposed on 443 externally. Strip the internal port from any redirect
  // Location headers so browsers don't time out trying to reach :8080.
  const location = response.headers.get("location");
  if (location) {
    try {
      const url = new URL(location);
      if (url.port && url.port !== "443" && url.port !== "80") {
        url.port = "";
        const fixed = NextResponse.redirect(url, { status: response.status });
        response.headers.forEach((value, key) => {
          if (key !== "location") fixed.headers.set(key, value);
        });
        return fixed;
      }
    } catch {
      // unparseable location — return original response unchanged
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except API routes, static files, _next internals
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/",
  ],
};
