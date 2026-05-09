import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const userId = session.user.id;
  const businesses = await prisma.business.findMany({ where: { userId } });
  const reviews = await prisma.review.findMany({
    where: { business: { userId } },
    select: { id: true, reviewerName: true, rating: true, businessId: true }
  });

  return NextResponse.json({ userId, businesses: businesses.map(b => ({ id: b.id, name: b.name })), reviews });
}
