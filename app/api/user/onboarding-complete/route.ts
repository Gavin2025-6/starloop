import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingTourCompleted: true },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[OnboardingComplete]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
