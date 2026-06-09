import { NextRequest, NextResponse } from "next/server";
import { trackReferralClick } from "@/lib/agents/referral-agent";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

    const referral = await trackReferralClick(code);
    if (!referral) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

    // Redirect to the business public profile with referral context
    const url = new URL(`/b/${referral.business.slug}`, req.nextUrl.origin);
    url.searchParams.set("ref", code);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[referral/track]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
