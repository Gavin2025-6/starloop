import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateJobNumber } from "@/lib/job-number";
import { sendSms } from "@/lib/twilio";

// Public endpoint — no auth required (customer-facing)
export async function POST(req: NextRequest) {
  try {
    const { businessId, name, phone, address, addressLine1, city, province, postalCode, country, notes, service, scheduledAt } = await req.json();
    if (!businessId || !name || !phone || !scheduledAt) {
      return NextResponse.json(
        { error: "businessId, name, phone, and scheduledAt required" },
        { status: 400 }
      );
    }
    if (!address) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Find or create customer by phone
    let customer = await prisma.customer.findFirst({ where: { businessId, phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { businessId, name, phone, addressLine1: address },
      });
    }

    const jobNumber = await generateJobNumber();
    const scheduledDate = new Date(scheduledAt);

    const job = await prisma.job.create({
      data: {
        jobNumber,
        clientToken: randomUUID(),
        businessId,
        customerId: customer.id,
        title: service ?? "Service Request",
        serviceType: service ?? "general",
        serviceDescription: service ?? null,
        description: notes ?? null,
        scheduledAt: scheduledDate,
        address: address || addressLine1 || null,
        addressLine1: addressLine1 || address || null,
        city: city || null,
        province: province || null,
        postalCode: postalCode || null,
        country: country || "Canada",
        customerName: name,
        customerPhone: phone,
        status: "scheduled",
        source: "booking_page",
        balanceAmount: 0,
      },
    });

    await prisma.jobEvent.create({
      data: {
        jobId: job.id,
        type: "booking_created",
        triggeredBy: "customer",
        payload: { source: "booking_page", customerName: name, customerPhone: phone },
      },
    });

    await prisma.agentLog.create({
      data: {
        businessId,
        agent: "intake",
        action: "Online booking",
        detail: `${name} (${phone}) booked ${service ?? "service"} on ${scheduledDate.toLocaleString()}`,
        customerId: customer.id,
      },
    });

    // Format booking details for SMS
    const dateLabel = scheduledDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const timeLabel = scheduledDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const serviceLabel = service ?? "Service";

    const customerSms = [
      `Hi ${name}! Your booking with ${business.name} is confirmed.`,
      `Service: ${serviceLabel}`,
      `When: ${dateLabel} at ${timeLabel}`,
      `Address: ${address}`,
      business.phone ? `Questions? Call us: ${business.phone}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const ownerSms = [
      `New booking from ${name} (${phone})!`,
      `Service: ${serviceLabel}`,
      `When: ${dateLabel} at ${timeLabel}`,
      `Address: ${address}`,
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
