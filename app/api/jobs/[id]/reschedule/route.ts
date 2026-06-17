import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { getAvailableSlots } from "@/lib/availability";
import { formatName } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { scheduledAt, scheduledEnd } = await req.json();

    if (!scheduledAt) {
      return NextResponse.json({ error: "scheduledAt is required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({
      where: { id, businessId: business.id },
      include: { customer: true },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    if (job.status !== "scheduled") {
      return NextResponse.json(
        { error: `Can only reschedule a job in 'scheduled' status. Current: ${job.status}` },
        { status: 400 }
      );
    }

    const newDate = new Date(scheduledAt);
    const dateStr = newDate.toISOString().slice(0, 10);

    // Validate availability for new slot (check for double-booking)
    const slots = await getAvailableSlots(business.id, dateStr);
    if (slots) {
      const requestedHour = newDate.getHours();
      const requestedMin = newDate.getMinutes();
      const ampm = requestedHour >= 12 ? "PM" : "AM";
      const h12 = requestedHour === 0 ? 12 : requestedHour > 12 ? requestedHour - 12 : requestedHour;
      const slotKey = `${h12}:${String(requestedMin).padStart(2, "0")} ${ampm}`;

      if (slots.available.length > 0 && !slots.available.includes(slotKey)) {
        return NextResponse.json(
          { error: "The requested time slot is not available. Please choose a different time." },
          { status: 409 }
        );
      }
    }

    // Update the job with new schedule (slot is auto-released by changing scheduledAt)
    const updated = await prisma.job.update({
      where: { id },
      data: {
        scheduledAt: newDate,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      },
      include: { customer: true },
    });

    await prisma.jobEvent.create({
      data: {
        jobId: id,
        type: "rescheduled",
        triggeredBy: session.user.id,
        payload: {
          oldScheduledAt: job.scheduledAt?.toISOString() ?? null,
          newScheduledAt: newDate.toISOString(),
        },
      },
    });

    // SMS customer with new time
    const customerPhone = job.customerPhone ?? job.customer.phone;
    if (customerPhone) {
      const dateLabel = newDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      const timeLabel = newDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      await sendSms({
        to: customerPhone,
        body: `Hi ${formatName(job.customerName ?? job.customer.name)}, your ${job.serviceType} appointment has been rescheduled to ${dateLabel} at ${timeLabel}.`.slice(0, 160),
      }).catch(() => {});
      await prisma.jobEvent.create({
        data: { jobId: id, type: "sms_sent", payload: { kind: "reschedule", newScheduledAt: newDate.toISOString() } },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[jobs/reschedule]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
