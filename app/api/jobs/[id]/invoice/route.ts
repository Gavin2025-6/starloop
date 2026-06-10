import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({ where: { id, businessId: business.id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const existing = await prisma.invoice.findUnique({ where: { jobId: id } });
    if (existing) return NextResponse.json(existing);

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({ where: { businessId: business.id } });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        jobId: id,
        businessId: business.id,
        customerId: job.customerId,
        invoiceNumber,
        lineItems: job.lineItems ?? [],
        subtotal: job.subtotal,
        tax: job.tax,
        total: job.total,
        dueDate: new Date(Date.now() + 30 * 86400000),
      },
    });

    await prisma.job.update({ where: { id }, data: { status: "invoiced" } });

    return NextResponse.json(invoice);
  } catch (err) {
    console.error("[jobs/invoice]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
