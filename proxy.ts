// next-intl i18n routing — runs as Next.js proxy (renamed from middleware)
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all paths except API routes, static files, _next internals
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/",
  ],
};
