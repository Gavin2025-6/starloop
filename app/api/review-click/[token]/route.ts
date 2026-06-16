import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — records click then redirects to Google review URL
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const via = req.nextUrl.searchParams.get("via") ?? "unknown";

  try {
    const job = await prisma.job.findUnique({
      where: { clientToken: token },
      include: {
        business: { select: { name: true, googleReviewUrl: true } },
        reviewStatus: true,
      },
    });

    const reviewUrl = job?.business.googleReviewUrl
      ?? (job?.business.name
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.business.name)}`
          : null);

    if (!job || !reviewUrl) {
      return NextResponse.redirect("https://www.google.com/search?q=review");
    }

    const isFirstClick = !job.reviewClicked;

    // Record click
    await prisma.job.update({
      where: { id: job.id },
      data: {
        reviewClicked: true,
        reviewClickedAt: new Date(),
        reviewClickedVia: via,
      },
    });

    if (job.reviewStatus) {
      await prisma.jobReviewStatus.update({
        where: { jobId: job.id },
        data: {
          reviewClicked: true,
          completedAt: isFirstClick ? new Date() : undefined,
          completedVia: isFirstClick ? via : undefined,
        },
      });
    }

    await prisma.jobEvent.create({
      data: {
        jobId: job.id,
        type: "review_link_clicked",
        payload: { via, isFirstClick },
      },
    });

    return NextResponse.redirect(reviewUrl);
  } catch (err) {
    console.error("[review-click]", err);
    return NextResponse.redirect("https://www.google.com");
  }
}
