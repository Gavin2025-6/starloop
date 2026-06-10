import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJobNumber } from "@/lib/job-number";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const { customerId, title, serviceType, description, priority, address, scheduledAt, lineItems, subtotal, tax, total, source } = await req.json();
    if (!customerId || !serviceType) return NextResponse.json({ error: "customerId and serviceType required" }, { status: 400 });

    const jobNumber = await generateJobNumber();

    const job = await prisma.job.create({
      data: {
        jobNumber,
        businessId: business.id,
        customerId,
        title: title || serviceType,
        serviceType,
        description: description || null,
        priority: priority || "normal",
        address: address || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        lineItems: lineItems || null,
        subtotal: subtotal || 0,
        tax: tax || 0,
        total: total || 0,
        source: source || "manual",
      },
      include: { customer: true },
    });

    return NextResponse.json(job);
  } catch (err) {
    console.error("[jobs/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
