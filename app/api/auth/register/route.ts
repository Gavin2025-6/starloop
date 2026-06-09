import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 0;
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${base}-${++i}`;
  }
  return slug;
}

export async function POST(request: Request) {
  try {
    const { name, businessName, industry, email, password } = await request.json();

    if (!name || !businessName || !email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "All fields required. Password min 6 chars." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = await uniqueSlug(slugify(businessName));

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: true, // skip email verification for MVP speed
      },
    });

    await prisma.business.create({
      data: {
        userId: user.id,
        name: businessName,
        industry: industry || "General",
        slug,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("[Auth/Register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
