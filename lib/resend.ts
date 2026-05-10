import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    from: `${businessName} <noreply@starloop.app>`,
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
