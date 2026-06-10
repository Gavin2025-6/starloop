import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { generateJobNumber } from "@/lib/job-number";

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

// Fetch next available slots across today + next 7 days for the intake agent
export async function getUpcomingSlots(businessId: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const results: string[] = [];

  for (let offset = 0; offset < 7; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().slice(0, 10);

    try {
      const res = await fetch(`${appUrl}/api/availability/slots?businessId=${businessId}&date=${dateStr}`);
      if (!res.ok) continue;
      const { slots } = await res.json();
      if (slots && slots.length > 0) {
        const dayLabel = offset === 0 ? "today" : offset === 1 ? "tomorrow"
          : d.toLocaleDateString("en-US", { weekday: "long" });
        results.push(`${dayLabel} (${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}) at ${slots.slice(0, 3).map((s: { label: string }) => s.label).join(", ")}`);
        if (results.length >= 3) break;
      }
    } catch {}
  }

  if (results.length === 0) return "";
  return results.join("; ");
}

export async function analyzeCallIntent(
  transcript: string,
  businessName: string,
  industry: string,
  businessId?: string
): Promise<IntentResult> {
  // Pre-fetch availability slots if this might be an appointment call
  let availabilityContext = "";
  if (businessId) {
    const slotsText = await getUpcomingSlots(businessId).catch(() => "");
    if (slotsText) {
      availabilityContext = `\n\nAvailable appointment slots: ${slotsText}`;
    }
  }

  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `You are analyzing a phone call to ${businessName} (${industry} business).
The caller said: "${transcript}"${availabilityContext}

Respond in JSON only:
{
  "intent": "appointment" | "emergency" | "inquiry" | "complaint" | "other",
  "isEmergency": true/false,
  "summary": "one sentence summary",
  "responseMessage": "what to say back to the caller (under 50 words, friendly). If intent is appointment AND availability is listed above, mention 2-3 specific times naturally, e.g. 'We have openings this week on Tuesday at 10am and Wednesday at 2pm. Which works best for you?'"
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

export async function handleVapiWebhook(data: {
  callerPhone: string;
  extractedData: { name?: string; serviceType?: string; address?: string; preferredDate?: string };
  businessId: string;
}): Promise<string> {
  const { callerPhone, extractedData, businessId } = data;

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });

  // 1. Find or create Customer by callerPhone
  let customer = await prisma.customer.findFirst({
    where: { businessId, phone: callerPhone },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        businessId,
        name: extractedData.name ?? "Unknown Caller",
        phone: callerPhone,
      },
    });
  } else if (extractedData.name && customer.name === "Unknown Caller") {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { name: extractedData.name },
    });
  }

  // 2. Create Job
  const jobNumber = await generateJobNumber();
  const hasDate = !!extractedData.preferredDate;
  const job = await prisma.job.create({
    data: {
      jobNumber,
      businessId,
      customerId: customer.id,
      title: extractedData.serviceType ?? "Service Request",
      serviceType: extractedData.serviceType ?? "General",
      address: extractedData.address ?? undefined,
      scheduledAt: hasDate ? new Date(extractedData.preferredDate!) : undefined,
      status: hasDate ? "scheduled" : "requested",
      source: "call",
    },
  });

  // 3. Send customer confirmation SMS
  const confirmMsg = `Hi ${customer.name}! Your ${job.serviceType} request with ${business.name} has been received. We'll be in touch shortly.`;
  if (customer.phone) {
    await sendSms({ to: customer.phone, body: confirmMsg }).catch(() => {});
  }

  // 4. Log Call record
  await prisma.call.create({
    data: {
      businessId,
      callerPhone,
      status: "answered",
      intent: "appointment",
      appointmentBooked: hasDate,
    },
  });

  await prisma.agentLog.create({
    data: {
      businessId,
      agent: "intake",
      action: "vapi webhook processed",
      detail: `Job ${jobNumber} created for ${callerPhone}`,
      customerId: customer.id,
    },
  });

  // 5. Return jobId
  return job.id;
}
