import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJobNumber } from "@/lib/job-number";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const {
      customerId, title, serviceType, description, priority,
      address, addressLine1, addressLine2, city, province, postalCode, country,
      scheduledAt, lineItems, subtotal, tax, total, source,
    } = await req.json();
    if (!customerId || !serviceType)
      return NextResponse.json({ error: "customerId and serviceType required" }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    const jobNumber = await generateJobNumber();
    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;

    const job = await prisma.job.create({
      data: {
        jobNumber,
        clientToken: randomUUID(),
        businessId: business.id,
        customerId,
        title: title || serviceType,
        serviceType,
        serviceDescription: description || null,
        description: description || null,
        priority: priority || "normal",
        address: address || addressLine1 || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        province: province || null,
        postalCode: postalCode || null,
        country: country || "Canada",
        scheduledAt: scheduledDate,
        lineItems: lineItems || null,
        subtotal: subtotal || 0,
        tax: tax || 0,
        total: total || 0,
        balanceAmount: total || 0,
        customerName: customer?.name ?? null,
        customerPhone: customer?.phone ?? null,
        status: "scheduled",
        source: source || "manual",
      },
      include: { customer: true },
    });

    await prisma.jobEvent.create({
      data: {
        jobId: job.id,
        type: "job_created",
        triggeredBy: session.user.id,
        payload: { source: source || "manual" },
      },
    });

    return NextResponse.json(job);
  } catch (err) {
    console.error("[jobs/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
