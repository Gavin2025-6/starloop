import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  analyzeCallIntent,
  transferTwiml,
  confirmationTwiml,
  logCall,
} from "@/lib/agents/intake-agent";

export async function POST(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get("businessId") ?? "";
    const body = await req.formData();
    const transcript = (body.get("SpeechResult") as string) ?? "";
    const callerPhone = (body.get("From") as string) ?? "unknown";

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return new NextResponse(
        `<?xml version="1.0"?><Response><Say>Sorry, we couldn't find your account. Please call back.</Say></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Analyze intent with Claude
    const result = await analyzeCallIntent(transcript, business.name, business.industry);

    // Log call with full details
    await logCall({
      businessId,
      callerPhone,
      status: result.isEmergency ? "transferred" : "answered",
      intent: result.intent,
      transcript,
      appointmentBooked: result.intent === "appointment",
    });

    // Emergency → transfer to business owner
    if (result.isEmergency && business.phone) {
      return new NextResponse(transferTwiml(business.phone), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Non-emergency → spoken confirmation
    return new NextResponse(confirmationTwiml(result.responseMessage), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[webhooks/voice/gather]", err);
    return new NextResponse(
      `<?xml version="1.0"?><Response><Say>Thank you for calling. Someone will be in touch shortly.</Say><Hangup/></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
