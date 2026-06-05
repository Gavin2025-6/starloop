import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!token) {
    return NextResponse.redirect(`${appUrl}/en/auth/verify-email?error=missing`);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.redirect(`${appUrl}/en/auth/verify-email?error=invalid`);
    }

    if (user.emailVerified) {
      // Already verified — just send to login
      return NextResponse.redirect(`${appUrl}/en/auth/login?verified=true`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });

    return NextResponse.redirect(`${appUrl}/en/auth/login?verified=true`);
  } catch (err) {
    console.error("[VerifyEmail]", err);
    return NextResponse.redirect(`${appUrl}/en/auth/verify-email?error=server`);
  }
}
