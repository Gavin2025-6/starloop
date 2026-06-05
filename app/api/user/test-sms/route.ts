import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { phoneToE164 } from "@/lib/utils";
import { NextResponse } from "next/server";

function friendlyTwilioError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  // Twilio trial: unverified destination number (Error 21608 / 21612)
  if (msg.includes("21608") || msg.includes("unverified") || msg.includes("not a verified")) {
    return "TRIAL_UNVERIFIED";
  }
  // Twilio trial: URL blocked (Error 30044)
  if (msg.includes("30044")) {
    return "TRIAL_URL_BLOCKED";
  }
  // Twilio credentials not set / wrong
  if (msg.includes("authenticate") || msg.includes("20003") || msg.includes("401")) {
    return "CREDENTIALS_INVALID";
  }
  return msg;
}

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

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json({ error: "CREDENTIALS_INVALID" }, { status: 503 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { businesses: { take: 1 } },
    });

    const businessName = user?.businesses[0]?.name ?? "Your Business";
    const ownerName = user?.name ?? "Owner";

    const body = `Hi ${ownerName}! This is a test message from StarLoop for ${businessName}. Your Service Recovery Protocol is ready.`;

    const e164 = phoneToE164(phone.trim());
    console.log("[TestSMS] Sending to:", e164);

    await sendSms({ to: e164, body });

    console.log("[TestSMS] ✓ Sent successfully to:", e164);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TestSMS] ✗ Error:", err);
    const code = friendlyTwilioError(err);
    return NextResponse.json({ error: code }, { status: 500 });
  }
}
