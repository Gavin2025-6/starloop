import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });
    const { date, reason } = await req.json();
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    const timeOff = await prisma.timeOff.create({
      data: { businessId: business.id, date: new Date(date), reason: reason ?? null },
    });
    return NextResponse.json(timeOff);
  } catch (err) { console.error("[time-off/POST]", err); return NextResponse.json({ error: "Internal error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await prisma.timeOff.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) { console.error("[time-off/DELETE]", err); return NextResponse.json({ error: "Internal error" }, { status: 500 }); }
}
