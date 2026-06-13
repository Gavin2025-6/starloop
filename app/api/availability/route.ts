import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const dateStr = searchParams.get("date");
    const businessId = searchParams.get("businessId");

    // Public mode: date + businessId → return available slots
    if (dateStr && businessId) {
      const result = await getAvailableSlots(businessId, dateStr);
      if (!result) return NextResponse.json({ error: "Business not found" }, { status: 404 });
      return NextResponse.json(result);
    }

    // Auth'd mode: return raw availability schedule
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });
    const [availability, timeOff] = await Promise.all([
      prisma.availability.findMany({ where: { businessId: business.id }, orderBy: { dayOfWeek: "asc" } }),
      prisma.timeOff.findMany({ where: { businessId: business.id }, orderBy: { date: "asc" } }),
    ]);
    return NextResponse.json({ availability, timeOff });
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
    const { availability, timeOff } = await req.json();
    await prisma.availability.deleteMany({ where: { businessId: business.id } });
    if (availability?.length) await prisma.availability.createMany({ data: availability.map((a: {dayOfWeek:number;startTime:string;endTime:string;slotDurationMin:number}) => ({ ...a, businessId: business.id })) });
    await prisma.timeOff.deleteMany({ where: { businessId: business.id } });
    if (timeOff?.length) await prisma.timeOff.createMany({ data: timeOff.map((t: {date:string;reason?:string}) => ({ businessId: business.id, date: new Date(t.date), reason: t.reason })) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[availability/POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
