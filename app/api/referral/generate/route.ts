import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateShareCode(): string {
  return randomBytes(4).toString("hex").toUpperCase(); // 8-char alphanumeric
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, serviceType, businessName, businessPhone, businessCity } = body;

    if (!customerId || !serviceType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    // Ensure customer belongs to this business
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId: business.id },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    let shareCode = generateShareCode();
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.referralLink.findUnique({ where: { shareCode } });
      if (!existing) break;
      shareCode = generateShareCode();
      attempts++;
    }

    const referralLink = await prisma.referralLink.create({
      data: {
        shareCode,
        customerId,
        businessId: business.id,
        serviceType,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://starloop.app";
    const shareUrl = `${appUrl}/r/${shareCode}`;

    const bName = businessName ?? business.name;
    const bCity = businessCity ?? "";
    const bPhone = businessPhone ?? business.phone ?? "";

    const whatsappText = encodeURIComponent(
      `Hey! I had a great experience with ${bName} for ${serviceType} in ${bCity}. Check them out: ${shareUrl}`
    );
    const smsText = `I loved ${bName}! Try their ${serviceType} service: ${shareUrl}`;
    const englishText = `I recently used ${bName} for ${serviceType} and highly recommend them. Book here: ${shareUrl}${bPhone ? ` or call ${bPhone}` : ""}`;

    return NextResponse.json({
      success: true,
      data: {
        id: referralLink.id,
        shareCode,
        shareUrl,
        whatsappUrl: `https://wa.me/?text=${whatsappText}`,
        whatsappText: decodeURIComponent(whatsappText),
        smsText,
        englishText,
      },
    });
  } catch (err) {
    console.error("[Referral/Generate]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
