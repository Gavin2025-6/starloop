import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { finalAmount, notes } = await req.json();

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business)
      return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({
      where: { id, businessId: business.id },
      include: { customer: true },
    });
    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    // Step 1: Update job to completed
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
        total: finalAmount != null ? finalAmount : job.total,
        notes: notes || job.notes || undefined,
      },
      include: { customer: true },
    });

    // Step 2: Write JobEvent (using AgentLog — no JobEvent model in schema)
    await prisma.agentLog.create({
      data: {
        businessId: business.id,
        agent: "jobs",
        action: "completed",
        detail: `Job ${job.jobNumber} marked complete · $${updatedJob.total}`,
        customerId: job.customerId,
      },
    });

    // Step 3: Auto-create Invoice (draft)
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({ where: { businessId: business.id } });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

    const amount = finalAmount ?? updatedJob.total;

    const existingInvoice = await prisma.invoice.findUnique({ where: { jobId: id } });
    const invoice = existingInvoice
      ? await prisma.invoice.update({
          where: { jobId: id },
          data: { total: amount, status: "draft" },
        })
      : await prisma.invoice.create({
          data: {
            jobId: id,
            businessId: business.id,
            customerId: job.customerId,
            invoiceNumber,
            status: "draft",
            lineItems: job.lineItems ?? [],
            subtotal: amount,
            tax: 0,
            total: amount,
            dueDate: new Date(Date.now() + 30 * 86400000),
          },
        });

    // Step 4: Send invoice SMS (status → sent) + queue follow-up
    if (job.customer.phone) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const isTrialTwilio = !process.env.TWILIO_PAID;
      const smsBody = isTrialTwilio
        ? `Your invoice from ${business.name}: $${amount}. Thank you!`
        : `Your invoice from ${business.name}: $${amount}. Pay here: ${appUrl}/pay/${invoice.id}`;

      await sendSms({ to: job.customer.phone, body: smsBody }).catch((smsErr) => {
        console.error("[jobs/complete] SMS error", smsErr);
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "sent" },
      });
    }

    // Queue follow-up review request + 30-day winback via AgentLog
    await prisma.agentLog.create({
      data: {
        businessId: business.id,
        agent: "followup",
        action: "review-request-queued",
        detail: `Review request queued for ${job.customer.name}`,
        customerId: job.customerId,
      },
    });

    await prisma.agentLog.create({
      data: {
        businessId: business.id,
        agent: "winback",
        action: "winback-30d-registered",
        detail: `30-day winback registered for ${job.customer.name}`,
        customerId: job.customerId,
      },
    });

    // Update customer stats
    await prisma.customer.update({
      where: { id: job.customerId },
      data: {
        lastFollowupAt: new Date(),
        serviceCount: { increment: 1 },
        lastServiceDate: new Date(),
        totalSpend: { increment: amount },
      },
    });

    return NextResponse.json({ job: updatedJob, invoice });
  } catch (err) {
    console.error("[jobs/complete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
