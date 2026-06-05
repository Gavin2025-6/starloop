import twilio from "twilio";

// Lazy init — same pattern as Resend. Twilio client at module top level
// would crash Railway builds if TWILIO_ACCOUNT_SID is absent at build time.
let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return _client;
}

interface SendSmsParams {
  to: string;
  body: string;
}

export async function sendSms({ to, body }: SendSmsParams): Promise<string> {
  const message = await getClient().messages.create({
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
  const { businessName, customerName } = params;
  return `Hi ${customerName}, thanks for visiting ${businessName}! How was your experience? We'd love your feedback.`;
}

export function buildFollowUpMessage(params: {
  businessName: string;
  customerName: string;
  reviewUrl: string;
  language: "en" | "zh-CN";
}): string {
  const { businessName, customerName } = params;
  return `Hi ${customerName}, ${businessName} here again! We hope you had a great experience and would really appreciate a quick review when you get a chance.`;
}
