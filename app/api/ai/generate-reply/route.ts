import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getSeasonalPromo(month: number, businessType: string): string {
  if (month >= 3 && month <= 5) return `Spring special: 10% off ${businessType} services this season`;
  if (month >= 6 && month <= 8) return `Summer deal: Free consultation with any ${businessType} booking`;
  if (month >= 9 && month <= 11) return `Fall offer: Bundle and save on ${businessType} packages`;
  return `Winter special: Holiday discount on ${businessType} services`;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      reviewText,
      rating,
      businessType,
      businessName,
      businessCity,
      reviewPlatform,
      currentPromo,
      month,
      reviewId,
      language,
    } = body;

    // Legacy mode: if reviewId provided without full params, use simplified path
    if (reviewId && !reviewText) {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { business: true },
      });
      if (!review || review.business.userId !== session.user.id) {
        return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      }
      const legacyPrompt = `You are a customer service representative for ${review.business.name}.
Reply to this ${review.rating}-star review in a warm, genuine tone. Keep to 50-80 words.
Review: ${review.content ?? ""}`;
      const legacyMsg = await client.messages.create({
        model: "claude-sonnet-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: legacyPrompt }],
      });
      const reply = legacyMsg.content[0].type === "text" ? legacyMsg.content[0].text.trim() : "";
      await prisma.review.update({ where: { id: reviewId }, data: { aiDraftReply: reply } });
      return NextResponse.json({ reply, success: true, data: { version_a: reply, version_b: reply, platforms: {} } });
    }

    const monthNum = month ? parseInt((month as string).split("-")[1] ?? "1") : new Date().getMonth() + 1;
    const promo = currentPromo || getSeasonalPromo(monthNum, businessType ?? "service");
    const cityTag = (businessCity ?? "").replace(/\s/g, "");
    const typeTag = (businessType ?? "").replace(/\s/g, "");

    const userPrompt = `Generate review reply content for this business. Return ONLY valid JSON, no markdown.

Business: ${businessName}
City: ${businessCity}
Type: ${businessType}
Platform: ${reviewPlatform}
Rating: ${rating}/5
Review: "${reviewText}"
Promo to use: "${promo}"

JSON structure:
{
  "version_a": "<standard reply ≤80 words referencing 1 specific detail, thanks customer, includes brand + ${businessCity}>",
  "version_b": "<conversion reply ≤80 words referencing 1 specific detail, CTA with the promo, ends with ${businessCity} + ${businessType}>",
  "google_reply": "<same content as version_b>",
  "yelp_reply": "<version_b slightly more formal>",
  "facebook_reply": "<version_b + 1 relevant emoji, warmer tone>",
  "instagram_caption": "<English: eye-catching first line, ~40 word body, hashtags #${cityTag} #${typeTag}>",
  "xiaohongshu_post": "<Chinese: 8-char title with keyword，70-char body，hashtags #城市服务 #行业推荐>"
}`;

    const msg = await client.messages.create({
      model: "claude-sonnet-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";

    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
      }
    }

    const version_a = parsed.version_a ?? "";
    const version_b = parsed.version_b ?? "";
    const platforms = {
      google_reply: parsed.google_reply ?? version_b,
      yelp_reply: parsed.yelp_reply ?? version_b,
      facebook_reply: parsed.facebook_reply ?? version_b,
      instagram_caption: parsed.instagram_caption ?? "",
      xiaohongshu_post: parsed.xiaohongshu_post ?? "",
    };

    // Update draft if reviewId provided with full params
    if (reviewId) {
      await prisma.review.update({ where: { id: reviewId }, data: { aiDraftReply: version_b } }).catch(() => {});
    }

    const reply = version_b || version_a;
    void language; // consumed for future use

    return NextResponse.json({
      success: true,
      reply,
      data: { version_a, version_b, platforms },
    });
  } catch (err) {
    console.error("[AI/GenerateReply]", err);
    return NextResponse.json({ success: false, error: "Failed to generate reply" }, { status: 500 });
  }
}
