import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface SendSmsParams {
  to: string;
  body: string;
}

export async function sendSms({ to, body }: SendSmsParams): Promise<string> {
  const message = await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
    body,
  });
  return message.sid;
}

export function buildReviewRequestMessage(params: {
  businessName: string;
  customerName: string;
  reviewUrl: string;
  language: "en" | "zh-CN";
}): string {
  const { businessName, customerName, reviewUrl, language } = params;

  if (language === "zh-CN") {
    return `嗨 ${customerName}！感谢您光顾${businessName}。您的体验感觉如何？非常期待您的反馈，谢谢！🙏`;
  }

  return `Hi ${customerName}, thanks for visiting ${businessName}! How was your experience? We'd love your feedback.`;
}

export function buildFollowUpMessage(params: {
  businessName: string;
  customerName: string;
  reviewUrl: string;
  language: "en" | "zh-CN";
}): string {
  const { businessName, customerName, reviewUrl, language } = params;

  if (language === "zh-CN") {
    return `${customerName} 您好，${businessName} 再次感谢您的光临！如果方便，希望您能分享一下这次体验 😊 ${reviewUrl}`;
  }

  return `Hi ${customerName}, ${businessName} here again! We hope you had a great experience and would really appreciate a quick review when you get a chance. 😊 ${reviewUrl}`;
}
