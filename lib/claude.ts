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

const TONE_DESC: Record<Tone, { en: string; zh: string }> = {
  PROFESSIONAL: {
    en: "professional and formal",
    zh: "专业正式",
  },
  WARM: {
    en: "warm and caring",
    zh: "温暖亲切",
  },
  FRIENDLY: {
    en: "casual and friendly",
    zh: "轻松随意",
  },
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
  const isZh = language === "zh-CN";
  const toneDesc = isZh ? TONE_DESC[tone].zh : TONE_DESC[tone].en;

  let systemPrompt: string;

  if (isZh) {
    systemPrompt = isNegative
      ? `你是${businessName}（${businessCategory}）的客服代表。
请用${toneDesc}的语气，用中文回复这条${rating}星差评。
回复要求：
- 先真诚感谢客户的反馈
- 承认客户遇到的问题，表示理解和重视
- 表达改进的诚意和具体行动
- 邀请客户再次光临，给我们改正的机会
- 语气诚恳，不辩解，不推卸责任
- 回复长度50-100字，口语化自然`
      : `你是${businessName}（${businessCategory}）的客服代表。
请用${toneDesc}的语气，用中文回复这条${rating}星好评。
回复要求：
- 真诚感谢客户具体提到的好的地方
- 表达很高兴为客户服务
- 欢迎客户下次再来
- 回复长度50-80字，自然亲切不生硬`;
  } else {
    systemPrompt = isNegative
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
  }

  const userMessage = isZh
    ? `客户名：${reviewerName || "这位客户"}\n评分：${rating}星\n评价内容：${reviewContent}`
    : `Reviewer: ${reviewerName || "Customer"}\nRating: ${rating} stars\nReview: ${reviewContent}`;

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
