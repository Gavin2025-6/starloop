import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getGoogleClient } from "@/lib/google/client";

function getAI() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { replyText, action } = await req.json();

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review || review.businessId !== business.id) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Generate AI reply
    if (action === "generate") {
      const ai = getAI();
      const msg = await ai.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [{
          role: "user",
          content: `You are responding to a ${review.rating}-star Google review on behalf of ${business.name}.
Review from ${review.authorName ?? "a customer"}: "${review.content}"
Write a professional, warm reply (2-4 sentences). Be specific to the review. Don't use templates. Don't start with "Thank you for your review".`,
        }],
      });
      const generated = (msg.content[0] as { text: string }).text;
      await prisma.review.update({ where: { id }, data: { aiReply: generated } });
      return NextResponse.json({ reply: generated });
    }

    // Save reply (mark as replied) + post to Google if connected
    if (action === "send" && replyText) {
      await prisma.review.update({
        where: { id },
        data: { aiReply: replyText, isReplied: true },
      });

      // Post to Google if this review has a googleReviewId
      const googleReviewId = (review as { googleReviewId?: string | null }).googleReviewId;
      if (googleReviewId) {
        try {
          const client = await getGoogleClient(business.id);
          if (client) {
            const replyUrl = `https://mybusiness.googleapis.com/v4/${googleReviewId}/reply`;
            const gRes = await fetch(replyUrl, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${client.accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ comment: replyText }),
            });
            if (!gRes.ok) {
              console.error("[reviews/reply] Google reply failed:", gRes.status, await gRes.text());
            }
          }
        } catch (gErr) {
          console.error("[reviews/reply] Google reply error:", gErr);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[reviews/reply]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
