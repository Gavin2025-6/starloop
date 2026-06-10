import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAiQuote } from "@/lib/ai-quote";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { serviceType } = await req.json();
    if (!serviceType) return NextResponse.json({ error: "serviceType required" }, { status: 400 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const tiers = await generateAiQuote({
      businessName: business.name,
      industry: business.industry,
      city: business.city || "your city",
      serviceType,
    });

    return NextResponse.json({ tiers });
  } catch (err) {
    console.error("[jobs/quote]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
