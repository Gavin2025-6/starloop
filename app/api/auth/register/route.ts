import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const { name, businessName, email, password } = await request.json();

    if (!name || !businessName || !email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "All fields are required. Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        plan: "FREE",
        trialEndsAt,
      },
    });

    // Create the business record immediately on registration
    await prisma.business.create({
      data: {
        userId: user.id,
        name: businessName,
      },
    });

    // Fire-and-forget welcome email
    sendWelcomeEmail({ to: user.email, name: user.name ?? user.email.split("@")[0] })
      .catch((err) => console.error("[Register/welcome-email]", err));

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("[Auth/Register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
