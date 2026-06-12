import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchQuoteFromPriceBook } from "@/lib/ai-quote";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { serviceType, description } = await req.json();
    const query = description || serviceType;
    if (!query) return NextResponse.json({ error: "description or serviceType required" }, { status: 400 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const result = await matchQuoteFromPriceBook({ businessId: business.id, description: query });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[jobs/quote]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
