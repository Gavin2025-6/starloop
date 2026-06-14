import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transitionJobStatus, type JobStatus, LEGAL_TRANSITIONS } from "@/lib/job-state-machine";

const ALL_VALID_STATUSES = new Set([
  "scheduled", "in_progress", "completed",
  "awaiting_payment", "paid", "partially_paid",
  "cancelled", "no_show",
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status, notes, internalNotes } = body;

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({ where: { id, businessId: business.id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    // Handle notes-only update
    if (status === undefined) {
      const updated = await prisma.job.update({
        where: { id },
        data: {
          ...(notes !== undefined ? { notes } : {}),
          ...(internalNotes !== undefined ? { internalNotes } : {}),
        },
      });
      return NextResponse.json(updated);
    }

    // Status change must go through state machine
    if (!ALL_VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    const updated = await transitionJobStatus(id, status as JobStatus, {
      triggeredBy: session.user.id,
    });

    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const isIllegal = msg.startsWith("Illegal transition");
    console.error("[jobs/status]", err);
    return NextResponse.json({ error: msg }, { status: isIllegal ? 400 : 500 });
  }
}

