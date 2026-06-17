import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const job = await prisma.job.findUnique({
      where: { clientToken: token },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            stripeAccountId: true,
            stripeChargesEnabled: true,
            googleBusinessUrl: true,
          },
        },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        payment: { select: { stripePaymentLinkId: true, status: true } },
      },
    });

    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only expose safe fields to the public
    return NextResponse.json({
      id: job.id,
      jobNumber: job.jobNumber,
      status: job.status,
      serviceType: job.serviceType,
      serviceDescription: job.serviceDescription,
      title: job.title,
      scheduledAt: job.scheduledAt,
      address: job.addressLine1
        ? [job.addressLine1, job.addressLine2, job.city, job.province].filter(Boolean).join(", ")
        : job.address,
      total: job.total,
      paidAmount: job.paidAmount,
      balanceAmount: job.balanceAmount,
      paymentMethod: job.paymentMethod,
      business: {
        name: job.business.name,
        phone: job.business.phone,
        slug: job.business.slug,
        googleBusinessUrl: job.business.googleBusinessUrl,
        stripeChargesEnabled: job.business.stripeChargesEnabled,
      },
      customer: {
        name: job.customer.name,
        email: job.customer.email,
      },
    });
  } catch (err) {
    console.error("[pay/token GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
