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

    // Guard: require Google OAuth credentials to be configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("[Google/Connect] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env vars");
      return NextResponse.json(
        { error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway environment variables." },
        { status: 503 }
      );
    }

    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[Google/Connect]", err);
    return NextResponse.json(
      { error: "Failed to initiate Google connection", detail: String(err) },
      { status: 500 }
    );
  }
}
