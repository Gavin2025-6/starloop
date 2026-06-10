import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    const { slug, serviceType, description, priority, name, phone, email, address, preferredDate } = await req.json();

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Upsert customer
    let customer = await prisma.customer.findFirst({ where: { businessId: business.id, phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { businessId: business.id, name, phone: phone || null, email: email || null, status: "active" },
      });
    }

    // SMS to customer
    if (phone) {
      const msg = `✅ Booking confirmed with ${business.name}! Service: ${serviceType}${preferredDate ? ` · Time: ${new Date(preferredDate).toLocaleDateString()}` : ""}. We'll confirm shortly. Questions? Reply here.`;
      await sendSms({ to: phone, body: msg.slice(0, 160) }).catch(() => {});
    }

    // SMS to business
    if (business.phone) {
      const msg = `🔔 New booking! Customer: ${name} · Service: ${serviceType} · Priority: ${priority}${preferredDate ? ` · ${new Date(preferredDate).toLocaleDateString()}` : ""}. Phone: ${phone}`;
      await sendSms({ to: business.phone, body: msg.slice(0, 160) }).catch(() => {});
    }

    // Log
    await prisma.agentLog.create({
      data: { businessId: business.id, agent: "intake", action: "Online booking received", detail: `${name} — ${serviceType} (${priority})`, customerId: customer.id },
    });

    return NextResponse.json({ success: true, customerId: customer.id });
  } catch (err) {
    console.error("[booking/create]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
