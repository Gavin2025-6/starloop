import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { greetingTwiml, logCall } from "@/lib/agents/intake-agent";

// Twilio POSTs application/x-www-form-urlencoded
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const callerPhone = (body.get("From") as string) ?? "unknown";
    const toPhone = (body.get("To") as string) ?? "";

    // Look up business by phone number, fall back to first business
    let business = await prisma.business.findFirst({
      where: { phone: toPhone },
    });
    if (!business) {
      business = await prisma.business.findFirst();
    }
    if (!business) {
      return new NextResponse(
        `<?xml version="1.0"?><Response><Say>Service unavailable.</Say></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Log the incoming call
    await logCall({
      businessId: business.id,
      callerPhone,
      status: "answered",
    });

    const twiml = greetingTwiml(business.name, business.id);
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[webhooks/voice]", err);
    return new NextResponse(
      `<?xml version="1.0"?><Response><Say>We're sorry, please call back later.</Say></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
