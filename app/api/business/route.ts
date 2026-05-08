import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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
}

export async function PATCH(request: Request) {
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

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: body,
  });
  return NextResponse.json(updated);
}
