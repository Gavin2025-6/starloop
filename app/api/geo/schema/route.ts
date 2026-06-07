import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    });

    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    const avgResult = await prisma.review.aggregate({
      where: { businessId: business.id },
      _avg: { rating: true },
      _count: { id: true },
    });
    const avgRating = avgResult._avg.rating ? Number(avgResult._avg.rating.toFixed(1)) : null;
    const reviewCount = avgResult._count.id;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://starloop.app";
    const profileUrl = business.slug ? `${appUrl}/r/${business.slug}` : appUrl;

    // Generate description and FAQs via Claude
    let description = `Professional ${business.category ?? "service"} business serving ${business.address ? "the local area" : "customers"}.`;
    let faqs: { question: string; answer: string }[] = [];

    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-5-20251001",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: `For a local business with these details:
Name: ${business.name}
Type: ${business.category ?? "service business"}
Address: ${business.address ?? "local area"}
Industry: ${business.industryType ?? business.category ?? "service"}

Generate:
1. A 60-character description (exactly, for LocalBusiness schema)
2. 5 FAQ pairs that customers commonly ask about this type of business

Return ONLY valid JSON:
{
  "description": "60-char description here",
  "faqs": [
    {"question": "Q1?", "answer": "A1"},
    {"question": "Q2?", "answer": "A2"},
    {"question": "Q3?", "answer": "A3"},
    {"question": "Q4?", "answer": "A4"},
    {"question": "Q5?", "answer": "A5"}
  ]
}`,
          },
        ],
      });
      const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
      let parsed: { description?: string; faqs?: { question: string; answer: string }[] } = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
        }
      }
      if (parsed.description) description = parsed.description.slice(0, 60);
      if (parsed.faqs && Array.isArray(parsed.faqs)) faqs = parsed.faqs.slice(0, 5);
    } catch {
      faqs = [
        { question: `What services does ${business.name} offer?`, answer: `${business.name} offers professional ${business.category ?? "service"} solutions for local customers.` },
        { question: "How can I book an appointment?", answer: "You can contact us by phone or visit our Google Business profile to see our hours." },
        { question: "Do you offer free quotes?", answer: "Yes, we provide free consultations and quotes for all new customers." },
        { question: "What areas do you serve?", answer: `We serve ${business.address ? "the local community" : "customers in our area"} and surrounding neighborhoods.` },
        { question: "Are you licensed and insured?", answer: `${business.name} is fully licensed and insured for your peace of mind.` },
      ];
    }

    // Build JSON-LD
    const jsonLdObj: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: business.name,
      description,
      url: profileUrl,
    };

    if (business.phone) jsonLdObj.telephone = business.phone;
    if (business.address) jsonLdObj.address = {
      "@type": "PostalAddress",
      streetAddress: business.address,
    };
    if (avgRating && reviewCount > 0) {
      jsonLdObj.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      };
    }
    if (business.category) jsonLdObj["@type"] = business.category.includes("Restaurant") ? "Restaurant" : "LocalBusiness";
    if (faqs.length > 0) {
      jsonLdObj.mainEntity = faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      }));
    }

    const jsonLdString = JSON.stringify(jsonLdObj, null, 2);
    const scriptTag = `<script type="application/ld+json">\n${jsonLdString}\n</script>`;

    return NextResponse.json({
      success: true,
      data: {
        description,
        faqs,
        jsonLd: jsonLdObj,
        scriptTag,
      },
    });
  } catch (err) {
    console.error("[GEO/Schema]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
