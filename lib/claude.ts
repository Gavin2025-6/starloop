import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Tone = "PROFESSIONAL" | "WARM" | "FRIENDLY";
type Language = "en" | "zh-CN";

interface GenerateReplyParams {
  reviewContent: string;
  rating: number;
  reviewerName: string;
  businessName: string;
  businessCategory: string;
  tone: Tone;
  language: Language;
}

interface GenerateReplyResult {
  reply: string;
  language: Language;
}

const TONE_DESC: Record<Tone, string> = {
  PROFESSIONAL: "professional and formal",
  WARM: "warm and caring",
  FRIENDLY: "casual and friendly",
};

export async function generateReviewReply(
  params: GenerateReplyParams
): Promise<GenerateReplyResult> {
  const {
    reviewContent,
    rating,
    reviewerName,
    businessName,
    businessCategory,
    tone,
    language,
  } = params;

  const isNegative = rating <= 3;
  const toneDesc = TONE_DESC[tone];

  const systemPrompt =
    isNegative
      ? `You are a customer service representative for ${businessName} (${businessCategory}).
Reply to this ${rating}-star review in a ${toneDesc} tone in English.
Requirements:
- Sincerely thank the customer for their feedback
- Acknowledge the issue they experienced with empathy
- Express your commitment to improvement
- Invite them to give you another chance
- Never be defensive or make excuses
- Keep reply to 50-100 words, conversational and genuine`
      : `You are a customer service representative for ${businessName} (${businessCategory}).
Reply to this ${rating}-star review in a ${toneDesc} tone in English.
Requirements:
- Thank the customer for specific things they mentioned
- Express genuine appreciation for their support
- Welcome them back warmly
- Keep reply to 50-80 words, warm and natural`;

  const userMessage = `Reviewer: ${reviewerName || "Customer"}\nRating: ${rating} stars\nReview: ${reviewContent}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const reply =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  return { reply, language };
}
