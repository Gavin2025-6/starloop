import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildActivity } from "@/lib/activity-messages";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.findUnique({
      where: { id, businessId: business.id },
      include: {
        customer: true,
        invoice: true,
        payment: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check-on-read: if last review_request event was >72h ago and no review received, append hint
    const events = [...job.events];
    const lastReviewReq = [...events].reverse().find((e) => e.type === "sms_sent" && (e.payload as Record<string, unknown>)?.kind === "review_request");
    const hasReview = events.some((e) => e.type === "review_received");
    if (lastReviewReq && !hasReview) {
      const age = Date.now() - lastReviewReq.createdAt.getTime();
      if (age > 72 * 3600 * 1000) {
        events.push({
          id: `synthetic-no-review-${job.id}`,
          jobId: job.id,
          type: "review_no_response",
          payload: null,
          createdAt: new Date(lastReviewReq.createdAt.getTime() + 72 * 3600 * 1000),
        });
      }
    }

    const activity = buildActivity(events, job.customer.name);

    return NextResponse.json({ ...job, events, activity });
  } catch (err) {
    console.error("[jobs/[id] GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
