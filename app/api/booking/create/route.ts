import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJobNumber } from "@/lib/job-number";

// Public endpoint — no auth required (customer-facing)
export async function POST(req: NextRequest) {
  try {
    const { businessId, name, phone, notes, service, scheduledAt } = await req.json();
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

    return NextResponse.json({ jobId: job.id, jobNumber: job.jobNumber });
  } catch (err) {
    console.error("[booking/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
