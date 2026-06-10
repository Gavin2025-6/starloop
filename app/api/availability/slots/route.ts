import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const dateStr = searchParams.get("date");
    const businessId = searchParams.get("businessId");

    if (!dateStr || !businessId) {
      return NextResponse.json({ error: "date and businessId required" }, { status: 400 });
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0=Sun..6=Sat

    // Find availability for this day
    const avail = await prisma.availability.findFirst({
      where: { businessId, dayOfWeek },
    });
    if (!avail) return NextResponse.json({ slots: [] });

    // Check for time-off on this date
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const timeOff = await prisma.timeOff.findFirst({
      where: { businessId, date: { gte: startOfDay, lte: endOfDay } },
    });
    if (timeOff) return NextResponse.json({ slots: [] });

    // Generate all possible slots
    const [startH, startM] = avail.startTime.split(":").map(Number);
    const [endH, endM] = avail.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const step = avail.slotDurationMin;

    const allSlots: string[] = [];
    for (let m = startMin; m + step <= endMin; m += step) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      allSlots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }

    // Block slots taken by existing jobs
    const jobs = await prisma.job.findMany({
      where: {
        businessId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["cancelled"] },
      },
      select: { scheduledAt: true },
    });

    const bookedTimes = new Set(
      jobs.flatMap((j) => {
        if (!j.scheduledAt) return [];
        const h = j.scheduledAt.getHours();
        const m = j.scheduledAt.getMinutes();
        return [`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`];
      })
    );

    const slots = allSlots.map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }));

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("[availability/slots]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
