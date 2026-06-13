import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJobNumber } from "@/lib/job-number";
import { sendSms } from "@/lib/twilio";

// Public endpoint — no auth required (customer-facing)
export async function POST(req: NextRequest) {
  try {
    const { businessId, name, phone, address, notes, service, scheduledAt } = await req.json();
    if (!businessId || !name || !phone || !scheduledAt) {
      return NextResponse.json({ error: "businessId, name, phone, and scheduledAt required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Find or create customer by phone
    let customer = await prisma.customer.findFirst({ where: { businessId, phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { businessId, name, phone },
      });
    }

    const jobNumber = await generateJobNumber();
    const job = await prisma.job.create({
      data: {
        jobNumber,
        businessId,
        customerId: customer.id,
        title: service ?? "Service Request",
        serviceType: service ?? "general",
        description: notes ?? null,
        scheduledAt: new Date(scheduledAt),
        address: address ?? null,
        status: "requested",
        source: "booking_page",
      },
    });

    await prisma.agentLog.create({
      data: {
        businessId,
        agent: "intake",
        action: "Online booking",
        detail: `${name} (${phone}) booked ${service ?? "service"} on ${new Date(scheduledAt).toLocaleString()}`,
        customerId: customer.id,
      },
    });

    // Format booking details for SMS
    const bookedDate = new Date(scheduledAt);
    const dateLabel = bookedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const timeLabel = bookedDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const serviceLabel = service ?? "Service";

    // SMS to customer
    const customerSms = [
      `Hi ${name}! Your booking with ${business.name} is confirmed.`,
      `Service: ${serviceLabel}`,
      `When: ${dateLabel} at ${timeLabel}`,
      address ? `Address: ${address}` : null,
      business.phone ? `Questions? Call us: ${business.phone}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // SMS to business owner
    const ownerSms = [
      `New booking from ${name} (${phone})!`,
      `Service: ${serviceLabel}`,
      `When: ${dateLabel} at ${timeLabel}`,
      address ? `Address: ${address}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const smsPromises: Promise<unknown>[] = [];
    if (phone) smsPromises.push(sendSms({ to: phone, body: customerSms }).catch(() => {}));
    if (business.phone) smsPromises.push(sendSms({ to: business.phone, body: ownerSms }).catch(() => {}));
    await Promise.all(smsPromises);

    return NextResponse.json({ jobId: job.id, jobNumber: job.jobNumber });
  } catch (err) {
    console.error("[booking/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
