import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runFollowup } from "@/lib/agents/followup-agent";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    // Mark job as completed
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "completed", completedAt: new Date() },
    });

    const result = await runFollowup(jobId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[services/complete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
