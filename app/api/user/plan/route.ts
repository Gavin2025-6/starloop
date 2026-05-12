import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, currentPeriodEnd: true, stripeCustomerId: true },
    });

    return NextResponse.json({ plan: user?.plan ?? "FREE", currentPeriodEnd: user?.currentPeriodEnd });
  } catch (err) {
    console.error("[User/Plan/GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
