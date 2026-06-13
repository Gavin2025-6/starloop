import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAssistant, isVapiConfigured } from "@/lib/vapi/client";
import { buildVapiConfig } from "@/lib/vapi/build-assistant-config";

type BusinessWithRules = {
  bookingHoursStart?: string;
  bookingHoursEnd?: string;
  bookingBufferMins?: number;
  bookingWeekendEnabled?: boolean;
  vapiAssistantId?: string | null;
  avgJobDurationMins?: number;
  travelBufferMins?: number;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const b = business as typeof business & BusinessWithRules;

    return NextResponse.json({
      autoConfirmBooking:    business.autoConfirmBooking,
      bookingHoursStart:     b.bookingHoursStart     ?? "08:00",
      bookingHoursEnd:       b.bookingHoursEnd       ?? "18:00",
      bookingBufferMins:     b.bookingBufferMins      ?? 30,
      bookingWeekendEnabled: b.bookingWeekendEnabled  ?? false,
      avgJobDurationMins:    b.avgJobDurationMins     ?? 90,
      travelBufferMins:      b.travelBufferMins       ?? 30,
      vapiAssistantId:       b.vapiAssistantId        ?? null,
      vapiConfigured:        isVapiConfigured(),
    });
  } catch (err) {
    console.error("[booking-rules GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: { priceBookItems: { where: { isActive: true }, take: 20 } },
    });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.autoConfirmBooking    !== undefined) updateData.autoConfirmBooking    = body.autoConfirmBooking;
    if (body.bookingHoursStart     !== undefined) updateData.bookingHoursStart     = body.bookingHoursStart;
    if (body.bookingHoursEnd       !== undefined) updateData.bookingHoursEnd       = body.bookingHoursEnd;
    if (body.bookingBufferMins     !== undefined) updateData.bookingBufferMins     = Number(body.bookingBufferMins);
    if (body.bookingWeekendEnabled !== undefined) updateData.bookingWeekendEnabled = body.bookingWeekendEnabled;
    if (body.avgJobDurationMins    !== undefined) updateData.avgJobDurationMins    = Number(body.avgJobDurationMins);
    if (body.travelBufferMins      !== undefined) updateData.travelBufferMins      = Number(body.travelBufferMins);

    await prisma.business.update({ where: { id: business.id }, data: updateData });

    const b = business as typeof business & BusinessWithRules;
    const assistantId = b.vapiAssistantId ?? process.env.VAPI_ASSISTANT_ID;

    if (isVapiConfigured() && assistantId) {
      try {
        const config = buildVapiConfig({
          name: business.name,
          trade: business.trade ?? "HVAC",
          city: business.city ?? "",
          priceBookItems: business.priceBookItems.map(p => ({
            name: p.name,
            priceMin: Number(p.priceMin),
            priceMax: Number(p.priceMax),
            unit: p.unit,
          })),
          bookingRules: {
            hoursStart:          (updateData.bookingHoursStart     as string)  ?? "08:00",
            hoursEnd:            (updateData.bookingHoursEnd       as string)  ?? "18:00",
            bufferMins:          (updateData.bookingBufferMins     as number)  ?? 30,
            weekendEnabled:      (updateData.bookingWeekendEnabled as boolean) ?? false,
            autoConfirm:         (updateData.autoConfirmBooking    as boolean) ?? true,
            avgJobDurationMins:  (updateData.avgJobDurationMins    as number)  ?? 90,
            travelBufferMins:    (updateData.travelBufferMins      as number)  ?? 30,
          },
        });
        await updateAssistant(assistantId, {
          systemPrompt: config.model.systemPrompt,
          functions: config.functions,
          serverUrl: config.serverUrl,
        });
      } catch (vapiErr) {
        console.error("[booking-rules] Vapi push failed (non-fatal):", vapiErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[booking-rules POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
