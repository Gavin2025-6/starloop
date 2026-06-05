import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    // Set a short-lived cookie so middleware allows the next dashboard request
    // before the JWT is refreshed by auth(). Same pattern as starloop_google_connected.
    const response = NextResponse.json({ success: true });
    response.cookies.set("starloop_onboarding_complete", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 5, // 5 minutes — enough for JWT to refresh via auth()
    });
    return response;
  } catch (err) {
    console.error("[CompleteOnboarding]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
