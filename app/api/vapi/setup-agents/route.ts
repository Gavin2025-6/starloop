import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAssistant, updateAssistant, listAssistants, isVapiConfigured } from "@/lib/vapi/client";
import { AGENT_CONFIGS } from "@/lib/vapi/agents-config";

// Other agents (Dwight, Jim, Angela, Oscar, Andy) activated when first real users onboard.
// To activate all, call POST /api/vapi/setup-agents/all.

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isVapiConfigured()) {
      return NextResponse.json({ error: "VAPI_API_KEY not set" }, { status: 503 });
    }

    const erinConfig = AGENT_CONFIGS.erin;
    const existing = await listAssistants();
    const existingId = existing.find((a) => a.name === erinConfig.name)?.id;

    let assistant;
    if (existingId) {
      assistant = await updateAssistant(existingId, {
        firstMessage: erinConfig.firstMessage,
        systemPrompt: erinConfig.model.systemPrompt,
      });
      if (assistant) assistant.id = existingId;
    } else {
      assistant = await createAssistant(erinConfig);
    }

    if (!assistant) {
      return NextResponse.json({ error: "Failed to create Erin on Vapi" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      VAPI_AGENT_ERIN: assistant.id,
      VAPI_ASSISTANT_ID: assistant.id,
      message: "Erin agent created successfully",
    });
  } catch (err) {
    console.error("[vapi/setup-agents]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({
      erin:   process.env.VAPI_AGENT_ERIN   ?? "",
      dwight: process.env.VAPI_AGENT_DWIGHT ?? "",
      jim:    process.env.VAPI_AGENT_JIM    ?? "",
      angela: process.env.VAPI_AGENT_ANGELA ?? "",
      oscar:  process.env.VAPI_AGENT_OSCAR  ?? "",
      andy:   process.env.VAPI_AGENT_ANDY   ?? "",
    });
  } catch (err) {
    console.error("[vapi/setup-agents GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
