import { NextRequest, NextResponse } from "next/server";

// NextAuth v5 uses JWE tokens that are incompatible with getToken() from next-auth/jwt v4.
// Auth protection is handled client-side in dashboard/layout.tsx via useSession.
// This middleware only handles static pass-through.
export default function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
