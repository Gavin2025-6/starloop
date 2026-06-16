import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";

// Public endpoint — save customer email and send receipt
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { clientToken: token },
      include: {
        customer: true,
        business: { select: { name: true } },
      },
    });

    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Save email to customer record
    await prisma.customer.update({
      where: { id: job.customerId },
      data: { email },
    });

    // Send receipt if job is PAID
    if (job.status === "paid") {
      try {
        const resend = getResend();
        const formattedDate = job.completedAt
          ? new Date(job.completedAt).toLocaleDateString("en-CA", {
              year: "numeric", month: "long", day: "numeric",
            })
          : new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

        await resend.emails.send({
          from: "ServiceStar <noreply@servicestar.app>",
          to: email,
          subject: `Receipt from ${job.business.name}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
              <h2 style="color:#0D1117;margin-bottom:4px">${job.business.name}</h2>
              <p style="color:#6B7280;margin-top:0">Service Receipt</p>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0"/>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:6px 0;color:#6B7280">Service</td><td style="padding:6px 0;text-align:right;font-weight:600">${job.serviceType}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280">Date</td><td style="padding:6px 0;text-align:right">${formattedDate}</td></tr>
                <tr><td style="padding:6px 0;color:#6B7280">Amount Paid</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0D1117">$${job.paidAmount.toFixed(2)}</td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0"/>
              <p style="color:#6B7280;font-size:13px;text-align:center">Thank you for choosing ${job.business.name}!</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[pay/save-email] receipt email failed", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pay/token/save-email]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
