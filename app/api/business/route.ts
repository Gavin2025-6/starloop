import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        aiReplyTone: true,
        isGoogleConnected: true,
        googleTokenExpiry: true,
        googleReviewUrl: true,
      },
    });

    return NextResponse.json(business ?? null);
  } catch (err) {
    console.error("[Business/GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, category, aiReplyTone } = await request.json();

    const existing = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (existing) {
      const updated = await prisma.business.update({
        where: { id: existing.id },
        data: { name, category, aiReplyTone },
      });
      return NextResponse.json(updated);
    }

    const business = await prisma.business.create({
      data: { userId: session.user.id!, name, category, aiReplyTone },
    });
    return NextResponse.json(business);
  } catch (err) {
    console.error("[Business/POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.slug && body.slug !== business.slug) {
      const slugTaken = await prisma.business.findUnique({ where: { slug: body.slug } });
      if (slugTaken) {
        return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
      }
    }

    const updated = await prisma.business.update({
      where: { id: business.id },
      data: body,
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[Business/PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
