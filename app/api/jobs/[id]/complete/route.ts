import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transitionJobStatus } from "@/lib/job-state-machine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { finalAmount, notes, internalNotes, paymentChoice } = await req.json();

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({ where: { id, businessId: business.id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    // Update notes before transition (non-status fields)
    if (notes !== undefined || internalNotes !== undefined) {
      await prisma.job.update({
        where: { id },
        data: {
          ...(notes !== undefined ? { notes } : {}),
          ...(internalNotes !== undefined ? { internalNotes } : {}),
        },
      });
    }

    const amount = finalAmount !== undefined ? parseFloat(String(finalAmount)) || 0 : undefined;

    if (paymentChoice === "cash" || paymentChoice === "cheque") {
      // Cash/cheque: complete + immediately paid
      await transitionJobStatus(id, "completed", {
        triggeredBy: session.user.id,
        finalAmount: amount,
      });
      const updated = await transitionJobStatus(id, "paid", {
        triggeredBy: session.user.id,
        paidAmount: amount,
        paymentMethod: paymentChoice,
        note: `Paid by ${paymentChoice}`,
      });
      return NextResponse.json(updated);
    }

    // Default: complete → awaiting_payment (owner sends payment link separately)
    const updated = await transitionJobStatus(id, "completed", {
      triggeredBy: session.user.id,
      finalAmount: amount,
    });
    // Immediately move to awaiting_payment so the SMS gets sent
    const final = await transitionJobStatus(id, "awaiting_payment", {
      triggeredBy: session.user.id,
    });

    return NextResponse.json(final);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const isIllegal = msg.startsWith("Illegal transition");
    console.error("[jobs/complete]", err);
    return NextResponse.json({ error: msg }, { status: isIllegal ? 400 : 500 });
  }
}
