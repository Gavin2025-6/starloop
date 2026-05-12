import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    return NextResponse.json(user ?? {});
  } catch (err) {
    console.error("[User/Profile/GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, email, newPassword } = await request.json();

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    if (email && email !== session.user.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { name: true, email: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[User/Profile/PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
