import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 });
    }

    return NextResponse.redirect(getAuthUrl());
  } catch (err) {
    console.error("[Google/Auth]", err);
    return NextResponse.json({ error: "Failed to initiate Google connection" }, { status: 500 });
  }
}
