import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ChecklistItem {
  key: string;
  label: string;
  status: "green" | "yellow" | "red";
  tip: string;
  passed: boolean;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    const business = await prisma.business.findFirst({
      where: businessId
        ? { id: businessId, userId: session.user.id }
        : { userId: session.user.id },
      include: { _count: { select: { reviews: true } } },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    const reviewCount = business._count.reviews;

    const items: ChecklistItem[] = [
      {
        key: "business_name",
        label: "Business name set",
        passed: !!business.name && business.name.length > 2,
        status: !!business.name && business.name.length > 2 ? "green" : "red",
        tip: "Add your full legal business name to improve search accuracy.",
      },
      {
        key: "phone",
        label: "Phone number added",
        passed: !!business.phone,
        status: business.phone ? "green" : "red",
        tip: "A phone number makes it easy for AI assistants to recommend you and for customers to contact you.",
      },
      {
        key: "address",
        label: "Business address provided",
        passed: !!business.address,
        status: business.address ? "green" : "red",
        tip: "Your address is required for local search ranking. Add it in Settings.",
      },
      {
        key: "category",
        label: "Business category selected",
        passed: !!business.category,
        status: business.category ? "green" : "yellow",
        tip: "Your business type helps AI systems categorize and recommend you for relevant searches.",
      },
      {
        key: "google_connected",
        label: "Google Business connected",
        passed: business.isGoogleConnected,
        status: business.isGoogleConnected ? "green" : "red",
        tip: "Connect Google Business Profile to sync reviews and improve local SEO.",
      },
      {
        key: "review_count",
        label: "10+ Google reviews",
        passed: reviewCount >= 10,
        status: reviewCount >= 10 ? "green" : reviewCount >= 5 ? "yellow" : "red",
        tip: `You have ${reviewCount} review${reviewCount !== 1 ? "s" : ""}. AI search engines prefer businesses with 10+ reviews.`,
      },
      {
        key: "industry_type",
        label: "Industry type specified",
        passed: !!business.industryType,
        status: business.industryType ? "green" : "yellow",
        tip: "Specifying your industry helps AI assistants match you to user intent queries.",
      },
      {
        key: "slug",
        label: "Public profile URL created",
        passed: !!business.slug,
        status: business.slug ? "green" : "yellow",
        tip: "Create a public profile URL (e.g., starloop.app/r/your-business) that AI can index.",
      },
    ];

    const passedCount = items.filter((i) => i.passed).length;
    const completenessScore = Math.round((passedCount / items.length) * 100);

    // Generate AI recommendation
    const failedItems = items.filter((i) => !i.passed).map((i) => i.label);
    let recommendation = "";

    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-5-20251001",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `A local business called "${business.name}" has a GBP completeness score of ${completenessScore}%.
Missing items: ${failedItems.length > 0 ? failedItems.join(", ") : "None — all items complete"}.
Write a 2-sentence actionable recommendation to improve their AI search visibility. Be specific and encouraging.`,
          },
        ],
      });
      recommendation = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    } catch {
      recommendation =
        completenessScore === 100
          ? "Excellent! Your business profile is fully optimized for AI search visibility."
          : `Complete the missing items to reach 100% — fully optimized profiles appear 3x more often in AI assistant recommendations.`;
    }

    return NextResponse.json({
      success: true,
      data: {
        completenessScore,
        passedCount,
        totalItems: items.length,
        items,
        recommendation,
        businessName: business.name,
      },
    });
  } catch (err) {
    console.error("[GEO/Checklist]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
