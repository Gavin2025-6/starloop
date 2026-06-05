import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendEmailVerification } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    // Always return success to avoid email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    await sendEmailVerification({
      to: user.email,
      name: user.name ?? user.email.split("@")[0],
      verificationUrl: `${appUrl}/api/auth/verify-email?token=${token}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ResendVerification]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
