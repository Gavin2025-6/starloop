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
      select: { smsCredits: true },
    });
    return NextResponse.json({ smsCredits: user?.smsCredits ?? 0 });
  } catch (err) {
    console.error("[UserCredits]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
