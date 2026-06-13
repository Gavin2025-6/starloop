import { prisma } from "@/lib/prisma";

type BusinessRow = {
  id: string;
  bookingHoursStart: string;
  bookingHoursEnd: string;
  bookingWeekendEnabled: boolean;
  avgJobDurationMins: number;
  travelBufferMins: number;
};

export async function getAvailableSlots(
  businessId: string,
  dateStr: string
): Promise<{ date: string; available: string[]; timezone: string } | null> {
  const raw = await prisma.business.findUnique({ where: { id: businessId } });
  if (!raw) return null;

  const business = raw as typeof raw & BusinessRow;

  const date = new Date(dateStr + "T12:00:00");
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend && !business.bookingWeekendEnabled) {
    return { date: dateStr, available: [], timezone: "America/Toronto" };
  }

  const avgDuration = business.avgJobDurationMins ?? 90;
  const travelBuffer = business.travelBufferMins ?? 30;
  const totalJobMins = avgDuration + travelBuffer;

  const [sh, sm] = (business.bookingHoursStart ?? "08:00").split(":").map(Number);
  const [eh, em] = (business.bookingHoursEnd ?? "18:00").split(":").map(Number);
  const workStart = sh * 60 + sm;
  const workEnd = eh * 60 + em;

  const startOfDay = new Date(dateStr + "T00:00:00");
  const endOfDay = new Date(dateStr + "T23:59:59");

  const jobs = await prisma.job.findMany({
    where: {
      businessId,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ["cancelled"] },
    },
    select: { scheduledAt: true },
  });

  const bookedMins = jobs
    .filter(j => j.scheduledAt)
    .map(j => j.scheduledAt!.getHours() * 60 + j.scheduledAt!.getMinutes());

  const available: string[] = [];
  for (let mins = workStart; mins + avgDuration <= workEnd; mins += 30) {
    const blocked = bookedMins.some(
      jobStart => mins < jobStart + totalJobMins && mins + totalJobMins > jobStart
    );
    if (!blocked) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      available.push(`${h12}:${String(m).padStart(2, "0")} ${ampm}`);
    }
  }

  return { date: dateStr, available, timezone: "America/Toronto" };
}
