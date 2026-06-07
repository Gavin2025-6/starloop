import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ code: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  try {
    const { code } = await params;

    const referralLink = await prisma.referralLink.findUnique({
      where: { shareCode: code },
    });

    if (!referralLink) {
      return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "https://starloop.app"));
    }

    // Increment clicks
    await prisma.referralLink.update({
      where: { id: referralLink.id },
      data: { clicks: { increment: 1 } },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://starloop.app";
    return NextResponse.redirect(new URL(`/r/${code}`, appUrl));
  } catch (err) {
    console.error("[Referral/Track]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
