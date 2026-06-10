import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const availability = await prisma.availability.findUnique({
      where: { businessId: business.id },
    });

    if (!availability) {
      return NextResponse.json({
        workingDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
        startTime: "08:00",
        endTime: "18:00",
        slotDuration: 120,
        bufferTime: 30,
        timezone: "America/Toronto",
      });
    }

    return NextResponse.json(availability);
  } catch (err) {
    console.error("[availability/GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const { workingDays, startTime, endTime, slotDuration, bufferTime, timezone } = await req.json();

    const availability = await prisma.availability.upsert({
      where: { businessId: business.id },
      create: { businessId: business.id, workingDays, startTime, endTime, slotDuration, bufferTime, timezone },
      update: { workingDays, startTime, endTime, slotDuration, bufferTime, timezone },
    });

    return NextResponse.json(availability);
  } catch (err) {
    console.error("[availability/POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
