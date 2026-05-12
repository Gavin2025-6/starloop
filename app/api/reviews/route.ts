import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ reviews: [] });
    }

    const reviews = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, "businessId", platform, "reviewerName", rating, content, "publishedAt",
              "isReplied", "replyContent", "replyPublishedAt", "aiDraftReply",
              "isNegative", source, "contactPhone", "contactEmail", "externalId",
              "taskStatus", "resolvedAt", "archivedAt", "createdAt"
       FROM "Review"
       WHERE "businessId" = $1
       ORDER BY "publishedAt" DESC`,
      business.id
    );

    // Auto-archive resolved reviews older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toArchive = reviews.filter(
      (r) =>
        r.taskStatus === "resolved" &&
        r.resolvedAt &&
        new Date(r.resolvedAt as string) < sevenDaysAgo
    );
    if (toArchive.length > 0) {
      const ids = toArchive.map((r) => r.id as string);
      await prisma.review.updateMany({
        where: { id: { in: ids } },
        data: { taskStatus: "archived", archivedAt: new Date() },
      });
      // Update in memory too
      for (const r of reviews) {
        if (ids.includes(r.id as string)) {
          r.taskStatus = "archived";
        }
      }
    }

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("[Reviews/GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
