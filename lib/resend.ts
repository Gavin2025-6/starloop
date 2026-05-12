import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Shared layout helpers ────────────────────────────────────────────────────

function emailShell(body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        ${body}
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">Powered by <strong style="color:#6b7280;">StarLoop</strong> · Review management for local businesses</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailHeader(emoji: string, title: string, subtitle: string, gradient = "135deg,#2563eb,#1d4ed8") {
  return `<tr><td style="background:linear-gradient(${gradient});padding:36px 40px 28px;text-align:center;">
    <div style="font-size:38px;margin-bottom:10px;">${emoji}</div>
    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${title}</h1>
    <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">${subtitle}</p>
  </td></tr>`;
}

function emailBtn(href: string, label: string, color = "#2563eb") {
  return `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
    <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.01em;">${label}</a>
  </td></tr></table>`;
}

// ─── 1. Welcome Email ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://starloop.app";

  const body = emailShell(`
    ${emailHeader("⭐", "Welcome to StarLoop!", `Hi ${name}, your account is ready`, "135deg,#2563eb,#7c3aed")}
    <tr><td style="padding:36px 40px 8px;">
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        You're all set to start collecting more 5-star reviews and protecting your reputation. Here's how to get started in 3 easy steps:
      </p>

      <!-- Step 1 -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td width="44" valign="top" style="padding-top:2px;">
            <div style="width:32px;height:32px;background:#eff6ff;border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:700;color:#2563eb;">1</div>
          </td>
          <td>
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">Connect your Google Business</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Link your Google profile so we can sync reviews and send customers to the right place.</p>
          </td>
        </tr>
      </table>

      <!-- Step 2 -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td width="44" valign="top" style="padding-top:2px;">
            <div style="width:32px;height:32px;background:#f0fdf4;border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:700;color:#16a34a;">2</div>
          </td>
          <td>
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">Add your first customer</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Enter their name and phone or email — takes 10 seconds.</p>
          </td>
        </tr>
      </table>

      <!-- Step 3 -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td width="44" valign="top" style="padding-top:2px;">
            <div style="width:32px;height:32px;background:#fefce8;border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:700;color:#ca8a04;">3</div>
          </td>
          <td>
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">Send your first review request</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Send via SMS or email — happy customers go to Google, unhappy ones come to you privately.</p>
          </td>
        </tr>
      </table>

      ${emailBtn(`${appUrl}/en/dashboard`, "Go to Dashboard →")}

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0 0 8px;">
        Questions? Reply to this email — we're a small team and we actually read our inbox.
      </p>
    </td></tr>
  `);

  return resend.emails.send({
    from: "StarLoop <onboarding@resend.dev>",
    to,
    subject: `Welcome to StarLoop, ${name}! Here's how to get started`,
    html: body,
  });
}

// ─── 2. New Review Notification ───────────────────────────────────────────────

export async function sendNewReviewNotification({
  to,
  businessName,
  reviewerName,
  rating,
  content,
  reviewId,
}: {
  to: string;
  businessName: string;
  reviewerName: string;
  rating: number;
  content: string;
  reviewId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://starloop.app";
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const ratingColor = rating >= 4 ? "#16a34a" : rating === 3 ? "#ca8a04" : "#dc2626";

  const body = emailShell(`
    ${emailHeader("⭐", "New Review Received", `${businessName} got a new ${rating}-star review`)}
    <tr><td style="padding:36px 40px 8px;">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:40px;height:40px;background:#e0e7ff;border-radius:50%;text-align:center;line-height:40px;font-size:16px;font-weight:700;color:#4f46e5;">${(reviewerName ?? "A")[0].toUpperCase()}</div>
          <div>
            <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${reviewerName}</p>
            <p style="margin:2px 0 0;font-size:18px;color:${ratingColor};letter-spacing:1px;">${stars}</p>
          </div>
        </div>
        ${content ? `<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">"${content}"</p>` : '<p style="margin:0;font-size:13px;color:#9ca3af;">No written feedback.</p>'}
      </div>
      ${emailBtn(`${appUrl}/en/dashboard/reviews`, "View & Reply →", "#2563eb")}
    </td></tr>
  `);

  return resend.emails.send({
    from: "StarLoop <onboarding@resend.dev>",
    to,
    subject: `${stars} New ${rating}-star review from ${reviewerName} — ${businessName}`,
    html: body,
  });
}

// ─── 3. Negative Review Urgent Alert ─────────────────────────────────────────

export async function sendNegativeReviewAlert({
  to,
  businessName,
  reviewerName,
  rating,
  content,
  contactPhone,
  contactEmail,
}: {
  to: string;
  businessName: string;
  reviewerName: string;
  rating: number;
  content: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://starloop.app";
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  const contactSection = (contactPhone || contactEmail) ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#c2410c;">📞 Customer contact info</p>
      ${contactPhone ? `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Phone: <strong>${contactPhone}</strong></p>` : ""}
      ${contactEmail ? `<p style="margin:0;font-size:13px;color:#374151;">Email: <strong>${contactEmail}</strong></p>` : ""}
    </div>` : "";

  const body = emailShell(`
    ${emailHeader("🚨", "Urgent: Negative Review Received", "Action needed — respond within 24 hours", "135deg,#dc2626,#b91c1c")}
    <tr><td style="padding:36px 40px 8px;">
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#dc2626;">⚠️ NEEDS IMMEDIATE ATTENTION</p>
        <p style="margin:4px 0 0;font-size:12px;color:#b91c1c;">Responding quickly to negative reviews can turn unhappy customers into loyal ones.</p>
      </div>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">${reviewerName}</p>
        <p style="margin:0 0 12px;font-size:18px;color:#dc2626;letter-spacing:1px;">${stars} (${rating}/5)</p>
        ${content ? `<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">"${content}"</p>` : '<p style="margin:0;font-size:13px;color:#9ca3af;">No written feedback.</p>'}
      </div>

      ${contactSection}

      <p style="font-size:14px;color:#374151;font-weight:600;margin:0 0 10px;">How to handle this:</p>
      <ul style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:13px;line-height:2;">
        <li>Reach out to the customer directly if you have their contact</li>
        <li>Acknowledge their concern — never argue or dismiss</li>
        <li>Offer a concrete resolution (refund, redo, apology)</li>
        <li>Ask them to update their review once resolved</li>
      </ul>

      ${emailBtn(`${appUrl}/en/dashboard/reviews`, "View Review & Take Action →", "#dc2626")}
    </td></tr>
  `);

  return resend.emails.send({
    from: "StarLoop <onboarding@resend.dev>",
    to,
    subject: `🚨 Urgent: ${rating}★ review from ${reviewerName} needs your response — ${businessName}`,
    html: body,
  });
}

// ─── 4. Review Request Sent Confirmation ─────────────────────────────────────

export async function sendRequestConfirmation({
  to,
  businessName,
  customerName,
  channel,
  scheduledAt,
}: {
  to: string;
  businessName: string;
  customerName: string;
  channel: "SMS" | "EMAIL";
  scheduledAt?: Date | null;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://starloop.app";
  const isScheduled = !!scheduledAt;
  const channelLabel = channel === "SMS" ? "📱 SMS" : "📧 Email";
  const timeLabel = isScheduled
    ? scheduledAt!.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "Just now";

  const body = emailShell(`
    ${emailHeader("✅", isScheduled ? "Review Request Scheduled" : "Review Request Sent!", `${businessName}`, "135deg,#059669,#047857")}
    <tr><td style="padding:36px 40px 8px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        ${isScheduled
          ? `Your review request for <strong>${customerName}</strong> has been scheduled and will be sent automatically.`
          : `Your review request was successfully sent to <strong>${customerName}</strong>.`
        }
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:12px;border-bottom:1px solid #f3f4f6;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Recipient</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#111827;">${customerName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Channel</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#111827;">${channelLabel}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:12px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">${isScheduled ? "Scheduled For" : "Sent At"}</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#111827;">${timeLabel}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:#6b7280;margin:0 0 20px;">
        💡 <strong>Tip:</strong> Most customers respond within 2 hours of receiving the request. Check back soon!
      </p>

      ${emailBtn(`${appUrl}/en/dashboard/requests`, "View All Requests →", "#059669")}
    </td></tr>
  `);

  return resend.emails.send({
    from: "StarLoop <onboarding@resend.dev>",
    to,
    subject: isScheduled
      ? `📅 Scheduled: Review request for ${customerName} — ${businessName}`
      : `✅ Sent: Review request delivered to ${customerName} — ${businessName}`,
    html: body,
  });
}

interface SendReviewRequestEmailParams {
  to: string;
  customerName: string;
  businessName: string;
  reviewUrl: string;
  language?: "en" | "zh-CN";
}

export async function sendReviewRequestEmail({
  to,
  customerName,
  businessName,
  reviewUrl,
  language = "en",
}: SendReviewRequestEmailParams) {
  const isZh = language === "zh-CN";

  const subject = isZh
    ? `${customerName}，感谢您光顾${businessName}`
    : `${customerName}, thank you for choosing ${businessName}`;

  const html = isZh
    ? buildZhTemplate({ customerName, businessName, reviewUrl })
    : buildEnTemplate({ customerName, businessName, reviewUrl });

  return resend.emails.send({
    // TODO (before go-live): verify starloop.app in Resend → can use noreply@starloop.app
    from: `${businessName} <onboarding@resend.dev>`,
    to,
    subject,
    html,
  });
}

function buildEnTemplate({ customerName, businessName, reviewUrl }: {
  customerName: string; businessName: string; reviewUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:40px 40px 32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">⭐</div>
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">${businessName}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${customerName},</p>
          <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
            Thank you so much for choosing <strong>${businessName}</strong>! We hope you had a great experience.
            Your feedback means the world to us — it helps us keep improving and helps other customers find us.
          </p>
          <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 32px;">
            Could you take 30 seconds to share your experience?
          </p>
          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
            <a href="${reviewUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;letter-spacing:0.01em;">
              ⭐ Share My Experience
            </a>
          </td></tr></table>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
            Takes less than 30 seconds · Your honest feedback is always welcome
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            ${businessName} · Powered by <strong style="color:#6b7280;">StarLoop</strong>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

interface ReputationReportData {
  avgRating: number;
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  ratingChange: number | null;
  positiveKeywords: string[];
  negativeKeywords: string[];
  actionItems: string[];
  summary: string;
}

export async function sendReputationReportEmail({
  to,
  businessName,
  month,
  report,
}: {
  to: string;
  businessName: string;
  month: string; // "2025-04"
  report: ReputationReportData;
}) {
  const [year, mon] = month.split("-");
  const monthLabel = new Date(Number(year), Number(mon) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const ratingChangeStr =
    report.ratingChange !== null
      ? `${report.ratingChange >= 0 ? "+" : ""}${report.ratingChange} ★ vs last month`
      : "First month on record";

  const positiveList = report.positiveKeywords.map((k) => `<li style="margin-bottom:4px;">✅ ${k}</li>`).join("");
  const negativeList = report.negativeKeywords.map((k) => `<li style="margin-bottom:4px;">⚠️ ${k}</li>`).join("");
  const actionList = report.actionItems
    .map((a, i) => `<li style="margin-bottom:8px;"><strong>${i + 1}.</strong> ${a}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);padding:36px 40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">📊</div>
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">${businessName}</h1>
          <p style="color:#c7d2fe;margin:6px 0 0;font-size:14px;">${monthLabel} Reputation Report</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">${report.summary}</p>

          <!-- Key metrics -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td width="25%" style="text-align:center;background:#f0fdf4;border-radius:12px;padding:16px 8px;">
                <div style="font-size:24px;font-weight:700;color:#15803d;">${report.avgRating}</div>
                <div style="font-size:11px;color:#16a34a;margin-top:2px;">Avg Rating</div>
              </td>
              <td width="4%"></td>
              <td width="25%" style="text-align:center;background:#eff6ff;border-radius:12px;padding:16px 8px;">
                <div style="font-size:24px;font-weight:700;color:#1d4ed8;">${report.totalReviews}</div>
                <div style="font-size:11px;color:#2563eb;margin-top:2px;">Total Reviews</div>
              </td>
              <td width="4%"></td>
              <td width="25%" style="text-align:center;background:#fefce8;border-radius:12px;padding:16px 8px;">
                <div style="font-size:24px;font-weight:700;color:#a16207;">${report.positiveCount}</div>
                <div style="font-size:11px;color:#ca8a04;margin-top:2px;">Positive (4-5★)</div>
              </td>
              <td width="4%"></td>
              <td width="25%" style="text-align:center;background:#fdf2f8;border-radius:12px;padding:16px 8px;">
                <div style="font-size:24px;font-weight:700;color:#9d174d;">${ratingChangeStr.split(" ")[0]}</div>
                <div style="font-size:11px;color:#be185d;margin-top:2px;">vs Last Month</div>
              </td>
            </tr>
          </table>

          ${positiveList ? `<h3 style="color:#111827;font-size:14px;margin:0 0 8px;">What customers loved</h3>
          <ul style="margin:0 0 20px;padding-left:20px;color:#374151;font-size:14px;">${positiveList}</ul>` : ""}

          ${negativeList ? `<h3 style="color:#111827;font-size:14px;margin:0 0 8px;">Areas needing attention</h3>
          <ul style="margin:0 0 20px;padding-left:20px;color:#374151;font-size:14px;">${negativeList}</ul>` : ""}

          <h3 style="color:#111827;font-size:14px;margin:0 0 8px;">Your action plan for next month</h3>
          <ol style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:14px;">${actionList}</ol>

          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/en/dashboard" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:600;">
              View Full Dashboard →
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="color:#9ca3af;font-size:11px;margin:0;">${businessName} · Monthly report by <strong style="color:#6b7280;">StarLoop</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: `StarLoop Reports <reports@starloop.app>`,
    to,
    subject: `📊 ${businessName} — ${monthLabel} Reputation Report`,
    html,
  });
}

function buildZhTemplate({ customerName, businessName, reviewUrl }: {
  customerName: string; businessName: string; reviewUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:40px 40px 32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">⭐</div>
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">${businessName}</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 16px;">您好，${customerName}！</p>
          <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 24px;">
            感谢您光顾<strong>${businessName}</strong>！希望您这次的体验令您满意。
            您的反馈对我们非常重要，不仅帮助我们持续改进，也让更多顾客能找到我们。
          </p>
          <p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 32px;">
            能花30秒分享一下您的体验吗？
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
            <a href="${reviewUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;">
              ⭐ 分享我的体验
            </a>
          </td></tr></table>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
            只需30秒 · 感谢您的宝贵意见
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            ${businessName} · 由 <strong style="color:#6b7280;">StarLoop</strong> 提供技术支持
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
