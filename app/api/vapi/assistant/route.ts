import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAssistant, updateAssistant, isVapiConfigured } from "@/lib/vapi/client";

async function getBusiness(userId: string) {
  return prisma.business.findUnique({ where: { userId } });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await getBusiness(session.user.id);
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    if (!isVapiConfigured()) {
      return NextResponse.json({ configured: false, assistant: null });
    }

    // Use per-business assistantId, fall back to global env var
    const assistantId = (business as { vapiAssistantId?: string | null }).vapiAssistantId
      ?? process.env.VAPI_ASSISTANT_ID;

    if (!assistantId) {
      return NextResponse.json({ configured: true, assistant: null, missingId: true });
    }

    const assistant = await getAssistant(assistantId);
    return NextResponse.json({ configured: true, assistant, assistantId });
  } catch (err) {
    console.error("[vapi/assistant GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await getBusiness(session.user.id);
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    if (!isVapiConfigured()) {
      return NextResponse.json({ error: "Vapi not configured" }, { status: 503 });
    }

    const { firstMessage, systemPrompt, assistantId: bodyId } = await req.json();

    const assistantId = bodyId
      ?? (business as { vapiAssistantId?: string | null }).vapiAssistantId
      ?? process.env.VAPI_ASSISTANT_ID;

    if (!assistantId) {
      return NextResponse.json({ error: "No Vapi assistant ID configured" }, { status: 400 });
    }

    const updated = await updateAssistant(assistantId, { firstMessage, systemPrompt });
    if (!updated) {
      return NextResponse.json({ error: "Vapi update failed" }, { status: 502 });
    }

    // If the business doesn't have vapiAssistantId stored yet, persist it
    if (!(business as { vapiAssistantId?: string | null }).vapiAssistantId && assistantId) {
      await prisma.business.update({
        where: { id: business.id },
        data: { vapiAssistantId: assistantId } as Record<string, unknown>,
      });
    }

    return NextResponse.json({ success: true, assistant: updated });
  } catch (err) {
    console.error("[vapi/assistant PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
