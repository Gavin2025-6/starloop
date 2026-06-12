import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Valid transitions: from -> allowed destinations
const TRANSITIONS: Record<string, string[]> = {
  requested:   ["scheduled", "cancelled"],
  scheduled:   ["in_progress", "requested", "cancelled"],
  in_progress: ["completed", "scheduled"],
  completed:   ["invoiced"],
  invoiced:    ["paid"],
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { to } = await req.json();

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business)
      return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({
      where: { id, businessId: business.id },
    });
    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const allowed = TRANSITIONS[job.status] ?? [];
    if (!allowed.includes(to)) {
      return NextResponse.json(
        { error: `Illegal transition: ${job.status} → ${to}` },
        { status: 400 }
      );
    }

    const updated = await prisma.job.update({
      where: { id },
      data: { status: to },
    });

    await prisma.jobEvent.create({
      data: { jobId: id, type: "status_changed", payload: { from: job.status, to } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[jobs/transition]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
