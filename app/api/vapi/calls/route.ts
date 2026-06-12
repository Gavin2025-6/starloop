import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listCalls, isVapiConfigured } from "@/lib/vapi/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ calls: [], source: "none" });

    // Try Vapi first
    if (isVapiConfigured()) {
      const assistantId = (business as { vapiAssistantId?: string | null }).vapiAssistantId
        ?? process.env.VAPI_ASSISTANT_ID;

      const vapiCalls = await listCalls({ assistantId: assistantId ?? undefined, limit: 50 });

      if (vapiCalls.length > 0) {
        // Normalize Vapi call shape for the UI
        const normalized = vapiCalls.map(c => ({
          id: c.id,
          callerPhone: c.customer?.number ?? "Unknown",
          status: c.status === "ended"
            ? (c.endedReason?.includes("missed") || c.endedReason?.includes("no-answer") ? "missed" : "answered")
            : c.status,
          intent: c.analysis?.summary ?? null,
          appointmentBooked:
            c.analysis?.successEvaluation?.toLowerCase().includes("booked") ||
            c.analysis?.successEvaluation?.toLowerCase().includes("appointment") ||
            false,
          createdAt: c.startedAt ?? new Date().toISOString(),
          duration: c.startedAt && c.endedAt
            ? Math.round((new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000)
            : null,
          transcript: c.artifact?.transcript ?? null,
          source: "vapi" as const,
        }));

        return NextResponse.json({ calls: normalized, source: "vapi" });
      }
    }

    // Fall back to local Call model
    const localCalls = await prisma.call.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, callerPhone: true, status: true, intent: true,
        appointmentBooked: true, createdAt: true,
      },
    });

    return NextResponse.json({
      calls: localCalls.map(c => ({ ...c, duration: null, transcript: null, source: "local" })),
      source: "local",
    });
  } catch (err) {
    console.error("[vapi/calls GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
