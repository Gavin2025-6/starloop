import { NextRequest, NextResponse } from "next/server";
import { handleVapiWebhook } from "@/lib/agents/intake-agent";

interface VapiWebhookBody {
  callId?: string;
  callerPhone: string;
  transcript?: string;
  extractedData?: {
    name?: string;
    serviceType?: string;
    address?: string;
    preferredDate?: string;
    preferredTime?: string;
  };
  businessId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: VapiWebhookBody = await req.json();

    if (!body.callerPhone || !body.businessId) {
      return NextResponse.json(
        { error: "callerPhone and businessId are required" },
        { status: 400 }
      );
    }

    const jobId = await handleVapiWebhook({
      callerPhone: body.callerPhone,
      extractedData: body.extractedData ?? {},
      businessId: body.businessId,
    });

    return NextResponse.json({ jobId }, { status: 200 });
  } catch (err) {
    console.error("[intake/webhook]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
