import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface QuoteResult {
  matched: boolean;
  itemId?: string;
  name?: string;
  priceMin?: number;
  priceMax?: number;
  unit?: string;
  confidence: number;
  quoteType: "pricebook" | "estimate_visit";
  estimateMessage?: string;
}

export async function matchQuoteFromPriceBook(params: {
  businessId: string;
  description: string;
}): Promise<QuoteResult> {
  const items = await prisma.priceBookItem.findMany({
    where: { businessId: params.businessId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  if (items.length === 0) {
    return {
      matched: false, confidence: 0, quoteType: "estimate_visit",
      estimateMessage: "We don't have a set price for this — let's book a free estimate visit.",
    };
  }

  const catalog = items.map((i, idx) =>
    `${idx + 1}. id=${i.id} | "${i.name}" $${Number(i.priceMin)}–$${Number(i.priceMax)} ${i.unit}${i.description ? ` (${i.description})` : ""}`
  ).join("\n");

  try {
    const msg = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `Match the customer's request to one item in this price book. Return ONLY valid JSON, no markdown.

Customer request: "${params.description}"

Price book:
${catalog}

JSON format: {"matched":true/false,"itemId":"item id or null","confidence":0.0-1.0}
Rules: matched=true only if confidence>=0.7 and request clearly maps to one item.`,
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
    const parsed: { matched?: boolean; itemId?: string; confidence?: number } = JSON.parse(text);
    const confidence = parsed.confidence ?? 0;

    if (parsed.matched && parsed.itemId && confidence >= 0.7) {
      const item = items.find((i) => i.id === parsed.itemId);
      if (item) {
        return {
          matched: true,
          itemId: item.id,
          name: item.name,
          priceMin: Number(item.priceMin),
          priceMax: Number(item.priceMax),
          unit: item.unit,
          confidence,
          quoteType: "pricebook",
        };
      }
    }

    return {
      matched: false, confidence, quoteType: "estimate_visit",
      estimateMessage: "This needs an in-person look. Let's book a free estimate visit.",
    };
  } catch {
    return {
      matched: false, confidence: 0, quoteType: "estimate_visit",
      estimateMessage: "This needs an in-person look. Let's book a free estimate visit.",
    };
  }
}
