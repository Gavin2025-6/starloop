// next-intl i18n routing — runs as Next.js proxy (renamed from middleware)
// Auto-detects browser language (Accept-Language header) via next-intl localeDetection.
// Default locale is "en". Chinese browsers are served "zh-CN" automatically.
// No manual language switcher — detection is fully automatic.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
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
