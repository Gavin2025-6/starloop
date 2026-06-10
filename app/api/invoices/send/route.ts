import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { invoiceId } = await req.json();
    if (!invoiceId)
      return NextResponse.json({ error: "invoiceId required" }, { status: 400 });

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business)
      return NextResponse.json({ error: "No business" }, { status: 404 });

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, businessId: business.id },
      include: {
        job: { include: { customer: true } },
      },
    });
    if (!invoice)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const customer = invoice.job.customer;
    if (!customer.phone)
      return NextResponse.json({ error: "Customer has no phone" }, { status: 400 });

    const amount = invoice.total;
    const notesPart = invoice.job.notes ? ` ${invoice.job.notes}` : "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const isTrialTwilio = !process.env.TWILIO_PAID;

    const body = isTrialTwilio
      ? `Your invoice from ${business.name}: $${amount}.${notesPart} Thank you!`
      : `Your invoice from ${business.name}: $${amount}.${notesPart} Pay here: ${appUrl}/pay/${invoice.id}`;

    await sendSms({ to: customer.phone, body });

    // Mark as sent (no sentAt field in schema — use status update)
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "sent" },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[invoices/send]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
