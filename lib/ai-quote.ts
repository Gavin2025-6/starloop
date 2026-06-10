import Anthropic from "@anthropic-ai/sdk";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface QuoteTier {
  name: string;
  items: Array<{ description: string; price: number }>;
  total: number;
}

export async function generateAiQuote(params: {
  businessName: string;
  industry: string;
  city: string;
  serviceType: string;
}): Promise<QuoteTier[]> {
  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are a pricing assistant for local service businesses.
Business: ${params.businessName}, Industry: ${params.industry}, City: ${params.city}
Service requested: ${params.serviceType}
Suggest 3 pricing tiers (basic/standard/premium) with line items.
Return ONLY valid JSON (no markdown):
{"tiers":[{"name":"Basic","items":[{"description":"string","price":0}],"total":0},{"name":"Standard","items":[{"description":"string","price":0}],"total":0},{"name":"Premium","items":[{"description":"string","price":0}],"total":0}]}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
  try {
    const parsed = JSON.parse(text);
    return parsed.tiers ?? [];
  } catch {
    return [
      { name: "Basic", items: [{ description: params.serviceType, price: 150 }], total: 150 },
      { name: "Standard", items: [{ description: `${params.serviceType} (standard)`, price: 250 }], total: 250 },
      { name: "Premium", items: [{ description: `${params.serviceType} (premium)`, price: 400 }], total: 400 },
    ];
  }
}
