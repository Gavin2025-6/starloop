import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAssistant, listAssistants, isVapiConfigured } from "@/lib/vapi/client";
import { AGENT_CONFIGS } from "@/lib/vapi/agents-config";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isVapiConfigured()) {
      return NextResponse.json({ error: "VAPI_API_KEY not set" }, { status: 503 });
    }

    const existing = await listAssistants();
    const byName = new Map(existing.map((a) => [a.name, a.id]));

    const results: Record<string, string> = {};

    for (const [key, config] of Object.entries(AGENT_CONFIGS)) {
      const existingId = byName.get(config.name);
      let assistant;

      if (existingId) {
        const { updateAssistant } = await import("@/lib/vapi/client");
        assistant = await updateAssistant(existingId, {
          firstMessage: config.firstMessage,
          systemPrompt: config.model.systemPrompt,
        });
        if (assistant) assistant.id = existingId;
      } else {
        assistant = await createAssistant(config);
      }

      if (assistant) {
        results[key] = assistant.id;
      } else {
        console.error(`[vapi/setup-agents] Failed to create/update ${key}`);
      }
    }

    return NextResponse.json({
      success: true,
      agents: results,
      envVars: Object.entries(results).map(([k, id]) =>
        `VAPI_AGENT_${k.toUpperCase()}=${id}`
      ).concat(results.erin ? [`VAPI_ASSISTANT_ID=${results.erin}`] : []),
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
