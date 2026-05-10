import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true, slug: true },
  });

  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { businessId, rating: 5, source: "GOOGLE" },
    orderBy: { publishedAt: "desc" },
    take: 5,
    select: {
      id: true,
      reviewerName: true,
      content: true,
      rating: true,
      publishedAt: true,
    },
  });

  return NextResponse.json(
    { businessName: business.name, slug: business.slug, reviews },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
