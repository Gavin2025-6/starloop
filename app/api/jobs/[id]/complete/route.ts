import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runFollowup } from "@/lib/agents/followup-agent";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { finalAmount, notes, internalNotes } = await req.json();

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const existing = await prisma.job.findUnique({ where: { id, businessId: business.id }, select: { status: true } });
    if (!existing) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const job = await prisma.job.update({
      where: { id, businessId: business.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        total: finalAmount ?? undefined,
        notes: notes || undefined,
        internalNotes: internalNotes || undefined,
      },
      include: { customer: true },
    });

    await prisma.jobEvent.create({
      data: { jobId: id, type: "status_changed", payload: { from: existing.status, to: "completed" } },
    });

    await runFollowup(job.id).catch(() => {});

    return NextResponse.json(job);
  } catch (err) {
    console.error("[jobs/complete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
