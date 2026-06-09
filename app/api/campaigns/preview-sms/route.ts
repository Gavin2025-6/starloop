import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWinbackSMS } from "@/lib/revenue-engine";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ sms: "" });

    // Use a sample customer for preview
    const sampleCustomer = await prisma.customer.findFirst({
      where: { businessId: business.id },
    });

    const customer = sampleCustomer
      ? { name: sampleCustomer.name, lastServiceDate: sampleCustomer.lastServiceDate }
      : { name: "Sarah", lastServiceDate: new Date(Date.now() - 90 * 86400000) };

    const sms = await generateWinbackSMS(customer, {
      name: business.name,
      industry: business.industry,
      slug: business.slug,
    });

    return NextResponse.json({ sms });
  } catch (err) {
    console.error("[campaigns/preview-sms]", err);
    return NextResponse.json({ sms: "" });
  }
}
