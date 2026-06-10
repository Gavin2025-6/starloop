import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business)
      return NextResponse.json({ error: "No business" }, { status: 404 });

    const invoice = await prisma.invoice.findUnique({
      where: { id, businessId: business.id },
    });
    if (!invoice)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: "paid",
        paidAt: new Date(),
      },
    });

    // Also update job status to paid
    await prisma.job.update({
      where: { id: invoice.jobId },
      data: { status: "paid" },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[invoices/mark-paid]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
