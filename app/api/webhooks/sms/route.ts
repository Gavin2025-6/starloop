import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const from = (body.get("From") as string) ?? "";
    const msgBody = ((body.get("Body") as string) ?? "").trim().toUpperCase();

    // Handle STOP (opt-out)
    if (msgBody === "STOP") {
      await prisma.customer.updateMany({
        where: { phone: from },
        data: { status: "opted-out", notes: "STOP received — no further SMS" },
      });
      return new NextResponse(
        `<?xml version="1.0"?><Response><Message>You've been unsubscribed. Reply START anytime to re-subscribe.</Message></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Handle START (re-subscribe)
    if (msgBody === "START") {
      const customers = await prisma.customer.findMany({ where: { phone: from } });
      for (const c of customers) {
        if (c.status === "opted-out") {
          await prisma.customer.update({ where: { id: c.id }, data: { status: "active", notes: null } });
        }
      }
      return new NextResponse(
        `<?xml version="1.0"?><Response><Message>You're back! You'll receive updates from your service provider.</Message></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Log inbound SMS as a campaign reply
    const customers = await prisma.customer.findMany({ where: { phone: from }, take: 1 });
    if (customers.length > 0) {
      await prisma.agentLog.create({
        data: {
          businessId: customers[0].businessId,
          agent: "intake",
          action: "Inbound SMS received",
          detail: `From ${from}: "${msgBody.slice(0, 80)}"`,
          customerId: customers[0].id,
        },
      });
    }

    return new NextResponse(`<?xml version="1.0"?><Response></Response>`, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[webhooks/sms]", err);
    return new NextResponse(`<?xml version="1.0"?><Response></Response>`, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
