import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSupportTicketConfirmation } from "@/lib/resend";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question } = await request.json();
    if (!question) return NextResponse.json({ ok: true }); // silently succeed

    const ticketId = randomBytes(3).toString("hex").toUpperCase();
    const userName = session.user.name ?? session.user.email.split("@")[0];

    // Fire-and-forget confirmation email
    sendSupportTicketConfirmation({
      to: session.user.email,
      name: userName,
      question,
      ticketId,
    }).catch(err => console.error("[SupportTicket]", err));

    return NextResponse.json({ ok: true, ticketId });
  } catch (err) {
    console.error("[SupportTicket]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
