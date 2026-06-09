import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function greetingTwiml(businessName: string, businessId: string): string {
  const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/voice/gather?businessId=${businessId}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling ${businessName}. Please briefly describe how we can help you today, and we'll make sure you get the right assistance.</Say>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="4" language="en-US">
  </Gather>
  <Say voice="Polly.Joanna">We didn't catch that. Please call back and we'll be happy to help.</Say>
</Response>`;
}

export function transferTwiml(businessPhone: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">This sounds urgent. Connecting you to our team right now.</Say>
  <Dial>${businessPhone}</Dial>
</Response>`;
}

export function confirmationTwiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${message}</Say>
  <Hangup/>
</Response>`;
}

interface IntentResult {
  intent: "appointment" | "emergency" | "inquiry" | "complaint" | "other";
  isEmergency: boolean;
  summary: string;
  responseMessage: string;
}

export async function analyzeCallIntent(
  transcript: string,
  businessName: string,
  industry: string
): Promise<IntentResult> {
  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are analyzing a phone call to ${businessName} (${industry} business).
The caller said: "${transcript}"

Respond in JSON only:
{
  "intent": "appointment" | "emergency" | "inquiry" | "complaint" | "other",
  "isEmergency": true/false,
  "summary": "one sentence summary",
  "responseMessage": "what to say back to the caller (under 30 words, friendly)"
}

Emergency = burst pipe, no heat in winter, gas leak, flooding, no power, urgent safety issue.`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const clean = text.replace(/```json\n?|\n?```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return {
      intent: "inquiry",
      isEmergency: false,
      summary: transcript.slice(0, 100),
      responseMessage: `Thanks for calling ${businessName}. Someone will follow up with you shortly.`,
    };
  }
}

export async function logCall(params: {
  businessId: string;
  callerPhone: string;
  status: string;
  intent?: string;
  transcript?: string;
  appointmentBooked?: boolean;
}) {
  const call = await prisma.call.create({ data: params });

  await prisma.agentLog.create({
    data: {
      businessId: params.businessId,
      agent: "intake",
      action: `Call ${params.status}`,
      detail: `${params.intent ?? "unknown"} — ${params.callerPhone}`,
    },
  });

  // Notify business owner by SMS on emergency
  if (params.intent === "emergency" && params.transcript) {
    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
    });
    if (business?.phone) {
      await sendSms({
        to: business.phone,
        body: `🚨 EMERGENCY CALL from ${params.callerPhone}: "${params.transcript?.slice(0, 100)}"`,
      }).catch(() => {});
    }
  }

  return call;
}
