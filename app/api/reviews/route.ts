import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const unreplied = searchParams.get("unreplied") === "true";
    const stars = searchParams.get("stars");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

    const where: Record<string, unknown> = { businessId: business.id };
    if (unreplied) where.isReplied = false;
    if (stars) where.rating = parseInt(stars, 10);
    if (dateFrom || dateTo) {
      where.reviewDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { reviewDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({ reviews, total, page, limit });
  } catch (err) {
    console.error("[reviews GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
