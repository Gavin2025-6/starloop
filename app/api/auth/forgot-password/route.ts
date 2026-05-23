import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always generate a token regardless of whether the email exists
    // (security best practice — don't reveal if email is registered)
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Check if user exists before saving token
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Save token to database
      await prisma.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          token,
          expiresAt,
        },
      });

      // Send password reset email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://starloop.app";
      const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#000000,#1a1a1a);padding:36px 40px 28px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Reset your password</h1>
          <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:13px;">Click the button below to set a new password.</p>
        </td></tr>
        <tr><td style="padding:36px 40px 8px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi there,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
            We received a request to reset the password for your StarLoop account. Click the button below to create a new password. This link expires in 1 hour.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.01em;">Reset Password</a>
          </td></tr></table>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0 0 24px;">
            If you didn't request this, you can safely ignore this email — your password will remain unchanged.
          </p>
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Or copy this link into your browser:<br/>
            <a href="${resetUrl}" style="color:#6b7280;word-break:break-all;">${resetUrl}</a>
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">Powered by <strong style="color:#6b7280;">StarLoop</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      resend.emails
        .send({
          from: "StarLoop <onboarding@resend.dev>",
          to: normalizedEmail,
          subject: "Reset your StarLoop password",
          html,
        })
        .catch((err) => console.error("[ForgotPassword/email]", err));
    }

    // Always return the same response regardless of whether email exists
    return NextResponse.json({
      message: "If an account exists with that email, we've sent a reset link.",
    });
  } catch (err) {
    console.error("[Auth/ForgotPassword]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
