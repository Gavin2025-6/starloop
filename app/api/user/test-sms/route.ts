import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { phoneToE164 } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await request.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { businesses: { take: 1 } },
    });

    const businessName = user?.businesses[0]?.name ?? "Your Business";
    const ownerName = user?.name ?? "Owner";

    const body = `Hi ${ownerName}! This is a test message from StarLoop for ${businessName}. Your Service Recovery Protocol is ready. 🎉`;

    const e164 = phoneToE164(phone.trim());
    await sendSms({ to: e164, body });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TestSMS]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
