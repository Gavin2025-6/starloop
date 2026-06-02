// next-intl i18n routing — runs as Next.js proxy (renamed from middleware)
// Auto-detects browser language (Accept-Language header) via next-intl localeDetection.
// Default locale is "en". Chinese browsers are served "zh-CN" automatically.
// No manual language switcher — detection is fully automatic.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Route guard: redirect authenticated users without Google connection
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  // Paths that bypass all guards
  const whitelistPaths = [
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
  const isWhitelisted = whitelistPaths.some(
    (p) =>
      pathname.startsWith(`/en${p}`) ||
      pathname.startsWith(`/${p}`) ||
      pathname === "/" ||
      pathname === "/en",
  );

  // Enforce 5-step onboarding before allowing dashboard access
  if (token && !isWhitelisted && token.onboardingCompleted === false) {
    return NextResponse.redirect(new URL("/en/onboarding", request.url));
  }

  const hasGoogleConnectedCookie = request.cookies.get("starloop_google_connected")?.value === "1";

  if (token && !isWhitelisted && token.isGoogleConnected === false && !hasGoogleConnectedCookie) {
    return NextResponse.redirect(new URL("/en/connect-google", request.url));
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
