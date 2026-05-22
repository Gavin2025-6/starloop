import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        businesses: {
          include: {
            reviewRequests: { where: { status: "PENDING" } },
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    const daysSinceLastLogin = Math.floor(
      (now.getTime() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const pendingRequestCount = user.businesses.reduce(
      (sum, b) => sum + b.reviewRequests.length, 0
    );

    return NextResponse.json({
      name: user.name?.split(" ")[0] || "there",
      isNewUser: user.onboardingCompleted === true,
      onboardingTourCompleted: user.onboardingTourCompleted === true,
      daysSinceLastLogin,
      pendingRequestCount,
    });
  } catch (err) {
    console.error("[UserState]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
