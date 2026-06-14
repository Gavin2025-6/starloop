import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transitionJobStatus } from "@/lib/job-state-machine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { cancelReason } = await req.json().catch(() => ({}));

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({ where: { id, businessId: business.id } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const updated = await transitionJobStatus(id, "cancelled", {
      triggeredBy: session.user.id,
      cancelReason: cancelReason || "Cancelled by business owner",
    });

    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const isIllegal = msg.startsWith("Illegal transition");
    console.error("[jobs/cancel]", err);
    return NextResponse.json({ error: msg }, { status: isIllegal ? 400 : 500 });
  }
}
