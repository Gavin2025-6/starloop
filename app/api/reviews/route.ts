import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  // Use raw SQL to ensure new fields are returned even with stale Prisma client cache
  const reviews = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT id, "businessId", platform, "reviewerName", rating, content, "publishedAt",
            "isReplied", "replyContent", "replyPublishedAt", "aiDraftReply",
            "isNegative", source, "contactPhone", "contactEmail", "externalId", "createdAt"
     FROM "Review"
     WHERE "businessId" = $1
     ORDER BY "publishedAt" DESC`,
    business.id
  );

  return NextResponse.json({ reviews });
}
