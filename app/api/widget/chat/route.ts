import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { generateJobNumber } from "@/lib/job-number";
import { sendSms } from "@/lib/twilio";
import { getAvailableSlots } from "@/lib/availability";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface BookingData {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  serviceDescription?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

function buildSystemPrompt(businessName: string, trade: string, priceBookSummary: string) {
  return `You are Erin, the friendly AI booking assistant for ${businessName}, a ${trade} business.

Your role is to book appointments via chat. Follow this conversation flow strictly:
1. Greet the customer warmly (already done in first message)
2. Ask for their name
3. Ask for their phone number
4. Ask for their service address (full street address)
5. Ask about the problem or service needed
6. Ask for their preferred date (get a specific date)
7. Use check_availability to check real availability for that date
8. Present available time slots and let the customer choose
9. Confirm all details: name, phone, address, service, date, time
10. Use book_appointment to create the booking
11. Confirm the booking is done

CRITICAL RULES:
- Ask ONE question at a time — never bundle multiple questions
- ALWAYS use check_availability before mentioning any times — never guess
- Be warm, conversational, and concise
- When the customer gives a date like "tomorrow" or "next Monday", convert it to YYYY-MM-DD format

Price information for ${businessName}:
${priceBookSummary || "Contact us for pricing — we provide free estimates."}

Never make up prices or availability. Always use the tools.`;
}

const tools: Anthropic.Tool[] = [
  {
    name: "check_availability",
    description: "Check available appointment slots for a given date. Call this when the customer provides a preferred date.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string" as const, description: "Date in YYYY-MM-DD format" },
      },
      required: ["date"],
    },
  },
  {
    name: "book_appointment",
    description: "Create the appointment booking. Only call after the customer confirms all details.",
    input_schema: {
      type: "object" as const,
      properties: {
        customerName:       { type: "string" as const, description: "Customer full name" },
        customerPhone:      { type: "string" as const, description: "Customer phone number" },
        customerAddress:    { type: "string" as const, description: "Full service address" },
        serviceDescription: { type: "string" as const, description: "Description of service needed" },
        appointmentDate:    { type: "string" as const, description: "Date in YYYY-MM-DD format" },
        appointmentTime:    { type: "string" as const, description: "Time slot e.g. '10:00 AM'" },
      },
      required: ["customerName", "customerPhone", "customerAddress", "serviceDescription", "appointmentDate", "appointmentTime"],
    },
  },
];

type ChatResult = {
  text: string;
  availableSlots?: string[];
  checkDate?: string;
  bookingComplete?: boolean;
  confirmationId?: string;
};

async function createBooking(input: BookingData & { appointmentDate: string; appointmentTime: string }, businessId: string): Promise<ChatResult> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return { text: "Sorry, I couldn't complete the booking. Please call us directly." };

  try {
    const timeStr = input.appointmentTime ?? "09:00 AM";
    const [timePart, meridiem] = timeStr.split(" ");
    const [hourStr, minStr] = timePart.split(":");
    let hour = parseInt(hourStr);
    const min = parseInt(minStr ?? "0");
    if (meridiem?.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;
    const scheduledAt = new Date(`${input.appointmentDate}T${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}:00`);

    let customer = await prisma.customer.findFirst({ where: { businessId, phone: input.customerPhone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { businessId, name: input.customerName ?? "Customer", phone: input.customerPhone, addressLine1: input.customerAddress },
      });
    }

    const jobNumber = await generateJobNumber();
    await prisma.job.create({
      data: {
        jobNumber,
        businessId,
        customerId: customer.id,
        title: input.serviceDescription ?? "Service Request",
        serviceType: input.serviceDescription ?? "general",
        description: `Address: ${input.customerAddress}`,
        scheduledAt,
        address: input.customerAddress,
        status: "requested",
        source: "chat_widget",
      },
    });

    await prisma.agentLog.create({
      data: {
        businessId,
        agent: "erin-widget",
        action: "Chat booking",
        detail: `${input.customerName} (${input.customerPhone}) booked ${input.serviceDescription} on ${input.appointmentDate} at ${input.appointmentTime}`,
        customerId: customer.id,
      },
    });

    if (input.customerPhone) {
      try {
        await sendSms({ to: input.customerPhone, body: `Hi ${input.customerName}! Your appointment with ${business.name} is confirmed for ${input.appointmentDate} at ${input.appointmentTime} at ${input.customerAddress}. Job #${jobNumber}.` });
      } catch { /* non-fatal */ }
    }
    if (business.phone) {
      try {
        await sendSms({ to: business.phone, body: `New booking from ${input.customerName}: ${input.serviceDescription} on ${input.appointmentDate} at ${input.appointmentTime}. Address: ${input.customerAddress}. Phone: ${input.customerPhone}. Job #${jobNumber}.` });
      } catch { /* non-fatal */ }
    }

    return {
      text: `You're all booked! ${business.name} will see you ${input.appointmentDate} at ${input.appointmentTime} at ${input.customerAddress}. We'll text a confirmation to ${input.customerPhone}. Your job number is ${jobNumber}. Have a great day!`,
      bookingComplete: true,
      confirmationId: jobNumber,
    };
  } catch (err) {
    console.error("[widget/chat/book]", err);
    return { text: "I had trouble completing the booking. Please call us directly." };
  }
}

async function chat(
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  businessId: string,
  depth = 0
): Promise<ChatResult> {
  if (depth > 4) return { text: "Something went wrong. Please try again." };

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: systemPrompt,
    messages,
    tools,
  });

  if (response.stop_reason === "tool_use") {
    const toolUseBlock = response.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    if (!toolUseBlock) return { text: "Sorry, something went wrong." };

    if (toolUseBlock.name === "check_availability") {
      const { date } = toolUseBlock.input as { date: string };
      const slots = await getAvailableSlots(businessId, date);
      const slotText = (!slots || slots.available.length === 0)
        ? "No slots available on this date."
        : `Available slots: ${slots.available.slice(0, 6).join(", ")}`;

      const nextMessages: Anthropic.MessageParam[] = [
        ...messages,
        { role: "assistant" as const, content: response.content },
        { role: "user" as const, content: [{ type: "tool_result" as const, tool_use_id: toolUseBlock.id, content: slotText }] },
      ];

      if (!slots || slots.available.length === 0) {
        return chat(systemPrompt, nextMessages, businessId, depth + 1);
      }

      const followUp = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: systemPrompt,
        messages: nextMessages,
        tools,
      });
      const textBlock = followUp.content.find((c): c is Anthropic.TextBlock => c.type === "text");
      return {
        text: textBlock?.text ?? "Here are the available times:",
        availableSlots: slots.available.slice(0, 6),
        checkDate: date,
      };
    }

    if (toolUseBlock.name === "book_appointment") {
      const input = toolUseBlock.input as BookingData & { appointmentDate: string; appointmentTime: string };
      return createBooking(input, businessId);
    }
  }

  const textBlock = response.content.find((c): c is Anthropic.TextBlock => c.type === "text");
  return { text: textBlock?.text ?? "I'm here to help!" };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, businessId }: { messages: ChatMessage[]; businessId: string } = await req.json();
    if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { priceBookItems: { where: { isActive: true }, take: 20 } },
    });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const priceBookSummary = business.priceBookItems
      .filter(p => Number(p.priceMin) > 0)
      .map(p => `- ${p.name}: $${p.priceMin}–$${p.priceMax} (${p.unit})`)
      .join("\n");

    const systemPrompt = buildSystemPrompt(business.name, business.industry, priceBookSummary);

    const anthropicMessages: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const result = await chat(systemPrompt, anthropicMessages, businessId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[widget/chat]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
