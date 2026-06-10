import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns available time slots for a given date and business
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const dateStr = searchParams.get("date");
    const businessId = searchParams.get("businessId");

    if (!dateStr || !businessId) {
      return NextResponse.json({ error: "date and businessId required" }, { status: 400 });
    }

    const availability = await prisma.availability.findUnique({ where: { businessId } });
    if (!availability) {
      return NextResponse.json({ slots: [] });
    }

    const tz = availability.timezone;
    const requestDate = new Date(dateStr);

    // Check what day of week this date is (in business timezone)
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: tz })
      .format(requestDate)
      .toLowerCase() as keyof typeof dayNames;

    const dayNames: Record<string, string> = {
      mon: "mon", tue: "tue", wed: "wed", thu: "thu", fri: "fri", sat: "sat", sun: "sun",
    };
    const shortToKey: Record<string, string> = {
      mon: "mon", tue: "tue", wed: "wed", thu: "thu", fri: "fri", sat: "sat", sun: "sun",
    };
    const workingDays = availability.workingDays as Record<string, boolean>;
    const dayKey = shortToKey[dayName];

    if (!dayKey || !workingDays[dayKey]) {
      return NextResponse.json({ slots: [] });
    }

    // Check for all-day time off
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const timeOffs = await prisma.timeOff.findMany({
      where: {
        businessId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    const allDayOff = timeOffs.some((t) => t.allDay);
    if (allDayOff) {
      return NextResponse.json({ slots: [] });
    }

    // Build all possible slots for the day
    const [startH, startM] = availability.startTime.split(":").map(Number);
    const [endH, endM] = availability.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slotStep = availability.slotDuration + availability.bufferTime;

    const allSlots: { time: string; label: string }[] = [];
    for (let m = startMinutes; m + availability.slotDuration <= endMinutes; m += slotStep) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const time = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      const label = new Date(`1970-01-01T${time}:00`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      allSlots.push({ time, label });
    }

    // Fetch existing jobs scheduled on this date
    const jobs = await prisma.job.findMany({
      where: {
        businessId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["cancelled", "rejected"] },
      },
      select: { scheduledAt: true },
    });

    const bookedMinutes = new Set<number>();
    for (const job of jobs) {
      if (!job.scheduledAt) continue;
      const jobH = job.scheduledAt.getHours();
      const jobM = job.scheduledAt.getMinutes();
      const jobStart = jobH * 60 + jobM;
      // Block the slot duration + buffer
      for (let i = 0; i < availability.slotDuration + availability.bufferTime; i++) {
        bookedMinutes.add(jobStart + i);
      }
    }

    // Partial time-off blocks
    for (const to of timeOffs) {
      if (!to.startTime || !to.endTime) continue;
      const [tH, tM] = to.startTime.split(":").map(Number);
      const [teH, teM] = to.endTime.split(":").map(Number);
      for (let i = tH * 60 + tM; i < teH * 60 + teM; i++) {
        bookedMinutes.add(i);
      }
    }

    const slots = allSlots.filter(({ time }) => {
      const [h, m] = time.split(":").map(Number);
      const slotStart = h * 60 + m;
      for (let i = slotStart; i < slotStart + availability.slotDuration; i++) {
        if (bookedMinutes.has(i)) return false;
      }
      return true;
    });

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("[availability/slots]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
