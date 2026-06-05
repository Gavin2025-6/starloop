import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/en/auth/login`
      );
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("[Google/Connect] ✗ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      return NextResponse.json(
        { error: "Google OAuth is not configured on the server." },
        { status: 503 }
      );
    }

    const url = getAuthUrl();
    // Log the redirect URI being used so it's visible in Railway logs
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
      ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;
    console.log("[Google/Connect] ▶ Redirecting to Google OAuth, redirect_uri:", redirectUri);
    console.log("[Google/Connect] Full auth URL:", url.split("?")[0], "...");

    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[Google/Connect] ✗ Exception:", err);
    return NextResponse.json(
      { error: "Failed to initiate Google connection", detail: String(err) },
      { status: 500 }
    );
  }
}
