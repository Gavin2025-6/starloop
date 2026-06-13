import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJobNumber } from "@/lib/job-number";
import { sendSms } from "@/lib/twilio";
import { getAvailableSlots } from "@/lib/availability";

// Vapi sends POST for all events including tool calls
// Body shape varies by message type; we handle tool-calls and function-call formats

interface VapiToolCall {
  id: string;
  type: string;
  function: { name: string; arguments: string };
}

interface VapiMessage {
  type: string;
  call?: { id?: string; assistantId?: string };
  toolCallList?: VapiToolCall[];
  functionCall?: { name: string; parameters: Record<string, unknown> };
}

async function findBusiness(assistantId: string | undefined) {
  if (!assistantId) return null;
  const byVapiId = await prisma.business.findFirst({
    where: { vapiAssistantId: assistantId } as Record<string, unknown>,
  });
  if (byVapiId) return byVapiId;
  if (process.env.VAPI_ASSISTANT_ID && assistantId === process.env.VAPI_ASSISTANT_ID) {
    return prisma.business.findFirst();
  }
  return null;
}

async function handleCheckAvailability(
  params: Record<string, unknown>,
  assistantId: string | undefined
): Promise<string> {
  const dateStr = params.date as string;
  if (!dateStr) return "I need a date to check availability. What date are you thinking?";

  const business = await findBusiness(assistantId);
  if (!business) return "I'm having trouble accessing our schedule right now. Please call us directly.";

  const result = await getAvailableSlots(business.id, dateStr);
  if (!result || result.available.length === 0) {
    return `Unfortunately there are no available slots on ${dateStr}. Can I check a different date for you?`;
  }

  const limited = result.available.slice(0, 6);
  return `On ${dateStr} we have these times available: ${limited.join(", ")}. Which works best for you?`;
}

async function handleBookAppointment(
  params: Record<string, unknown>,
  assistantId: string | undefined
): Promise<string> {
  const {
    customerName, customerPhone, customerAddress,
    serviceDescription, appointmentDate, appointmentTime,
    estimatedDuration,
  } = params as {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    serviceDescription: string;
    appointmentDate: string;
    appointmentTime: string;
    estimatedDuration?: number;
  };

  if (!customerName || !customerPhone || !appointmentDate || !appointmentTime) {
    return "I'm missing some details. Can you confirm the name, phone number, date, and time?";
  }

  const business = await findBusiness(assistantId);
  if (!business) return "I'm having trouble creating the booking. Please call us directly.";

  try {
    // Parse appointment datetime
    const [timePart, meridiem] = appointmentTime.split(" ");
    const [hourStr, minuteStr] = timePart.split(":");
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr ?? "0");
    if (meridiem?.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;
    const scheduledAt = new Date(`${appointmentDate}T${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:00`);

    // Find or create customer
    let customer = await prisma.customer.findFirst({ where: { businessId: business.id, phone: customerPhone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId: business.id,
          name: customerName,
          phone: customerPhone,
          addressLine1: customerAddress,
        },
      });
    }

    const jobNumber = await generateJobNumber();
    const job = await prisma.job.create({
      data: {
        jobNumber,
        businessId: business.id,
        customerId: customer.id,
        title: serviceDescription ?? "Service Request",
        serviceType: serviceDescription ?? "general",
        description: `Address: ${customerAddress}`,
        scheduledAt,
        address: customerAddress,
        status: "requested",
        source: "voice_booking",
      },
    });

    await prisma.agentLog.create({
      data: {
        businessId: business.id,
        agent: "erin",
        action: "Voice booking",
        detail: `${customerName} (${customerPhone}) booked ${serviceDescription} on ${appointmentDate} at ${appointmentTime} — ${customerAddress}`,
        customerId: customer.id,
      },
    });

    // SMS to customer
    if (customerPhone) {
      try {
        await sendSms({
          to: customerPhone,
          body: `Hi ${customerName}! Your appointment with ${business.name} is confirmed for ${appointmentDate} at ${appointmentTime} at ${customerAddress}. Job #${jobNumber}.`,
        });
      } catch { /* non-fatal */ }
    }

    // SMS to business owner
    if (business.phone) {
      try {
        await sendSms({
          to: business.phone,
          body: `New booking from ${customerName}: ${serviceDescription} on ${appointmentDate} at ${appointmentTime}. Address: ${customerAddress}. Phone: ${customerPhone}. Job #${jobNumber}.`,
        });
      } catch { /* non-fatal */ }
    }

    return `You're all booked! ${business.name} will see you ${appointmentDate} at ${appointmentTime} at ${customerAddress}. We'll send a confirmation text shortly. Your job number is ${jobNumber}. Have a great day!`;
  } catch (err) {
    console.error("[vapi/webhook/book]", err);
    return "I had trouble creating the booking. Please call us directly to confirm.";
  }
}

async function dispatchTool(
  name: string,
  params: Record<string, unknown>,
  assistantId: string | undefined
): Promise<string> {
  if (name === "check_availability") return handleCheckAvailability(params, assistantId);
  if (name === "book_appointment") return handleBookAppointment(params, assistantId);
  return `Tool '${name}' not recognized.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: VapiMessage = body.message ?? body;

    if (!message?.type) return NextResponse.json({ ok: true });

    const assistantId = message.call?.assistantId;

    // New tool-calls format
    if (message.type === "tool-calls" && message.toolCallList) {
      const results = await Promise.all(
        message.toolCallList.map(async (tc) => {
          let params: Record<string, unknown> = {};
          try { params = JSON.parse(tc.function?.arguments ?? "{}"); } catch { /* */ }
          const result = await dispatchTool(tc.function?.name, params, assistantId);
          return { toolCallId: tc.id, result };
        })
      );
      return NextResponse.json({ results });
    }

    // Legacy function-call format
    if (message.type === "function-call" && message.functionCall) {
      const { name, parameters } = message.functionCall;
      const result = await dispatchTool(name, parameters ?? {}, assistantId);
      return NextResponse.json({ result });
    }

    // Status updates, end-of-call, etc.
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vapi/webhook]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
