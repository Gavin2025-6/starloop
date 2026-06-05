import Logo from "@/components/ui/Logo";
import { Link } from "@/i18n/navigation";

export const metadata = {
  title: "Privacy Policy — StarLoop",
};

export default function PrivacyPage() {
  const updated = "June 5, 2026";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0A",
      color: "#FFFFFF",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: "28px 48px", borderBottom: "1px solid #1F1F1F" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo variant="dark" height={24} />
        </Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "64px 32px 96px" }}>
        <div style={{ marginBottom: "48px" }}>
          <div style={{
            display: "inline-block", padding: "4px 14px", borderRadius: "99px",
            background: "#111111", border: "1px solid #1F1F1F",
            fontSize: "12px", color: "#00C9A7", fontWeight: 600,
            marginBottom: "20px",
          }}>
            Legal
          </div>
          <h1 style={{ fontSize: "48px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "16px" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "#6B7280", fontSize: "15px" }}>Last updated: {updated}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

          <Section title="1. Who We Are">
            <p>StarLoop is a reputation management platform operated by Thinkmake AI Inc., based in Ontario, Canada. We are committed to protecting the privacy of our users and their customers in compliance with the <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong>.</p>
            <p>For privacy inquiries, contact us at: <a href="mailto:support@thinkmake.ai">support@thinkmake.ai</a></p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of information:</p>
            <ul>
              <li><strong>Account data:</strong> Your name, email address, and hashed password upon registration.</li>
              <li><strong>Business data:</strong> Business name, category, phone number, and address you provide.</li>
              <li><strong>Google Business data:</strong> Google Business Profile access tokens and review data synced through the Google API.</li>
              <li><strong>Customer data:</strong> Names, phone numbers, and email addresses of customers you add for SMS or email review requests.</li>
              <li><strong>Review data:</strong> Customer review content and ratings, both from Google and from private feedback submitted through StarLoop.</li>
              <li><strong>Payment data:</strong> Transaction records processed through Stripe. We do not store card numbers or payment credentials.</li>
              <li><strong>Usage data:</strong> Login timestamps, request history, and feature usage for product analytics.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Send SMS review requests and email notifications to your customers on your behalf.</li>
              <li>Sync and display your Google Business reviews in the StarLoop dashboard.</li>
              <li>Notify you when customers leave feedback, so you can respond appropriately.</li>
              <li>Generate AI-assisted reply drafts and monthly reputation reports.</li>
              <li>Process payments and maintain credit balances.</li>
              <li>Send transactional emails (account verification, receipts, alerts).</li>
            </ul>
            <p>We do not sell your data or use it for advertising purposes.</p>
          </Section>

          <Section title="4. Third-Party Services">
            <p>StarLoop shares data with the following trusted third parties only as necessary to provide the service:</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#111111" }}>
                    {["Provider", "Purpose", "Data Shared"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#FFFFFF", fontWeight: 600, border: "1px solid #1F1F1F" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Twilio",    "SMS delivery",           "Customer phone numbers, message content"],
                    ["Resend",    "Email delivery",          "Email addresses, email content"],
                    ["Google",    "Review data sync",        "Google Business access tokens"],
                    ["Stripe",    "Payment processing",      "Email address, transaction amounts"],
                    ["Anthropic", "AI reply generation",     "Review content (no personal identifiers)"],
                    ["Railway",   "Cloud hosting & database","All application data (stored encrypted)"],
                  ].map(([provider, purpose, data]) => (
                    <tr key={provider}>
                      {[<strong key="p">{provider}</strong>, purpose, data].map((cell, i) => (
                        <td key={i} style={{ padding: "10px 14px", border: "1px solid #1F1F1F", color: "#A1A1AA", verticalAlign: "top" }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>All third parties are required to handle data in compliance with applicable privacy laws.</p>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain your data for as long as your account is active. Upon account deletion:</p>
            <ul>
              <li>Your personal data, business data, and customer records are permanently deleted within <strong>30 days</strong>.</li>
              <li>Anonymized aggregate statistics may be retained for product analytics.</li>
              <li>Payment records may be retained as required by Canadian tax law (typically 7 years).</li>
            </ul>
          </Section>

          <Section title="6. Your Rights">
            <p>Under PIPEDA, you have the right to:</p>
            <ul>
              <li><strong>Access</strong> the personal information we hold about you.</li>
              <li><strong>Correct</strong> inaccurate information.</li>
              <li><strong>Request deletion</strong> of your data and account.</li>
              <li><strong>Withdraw consent</strong> for data processing at any time (which may require account termination).</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href="mailto:support@thinkmake.ai">support@thinkmake.ai</a>. We will respond within 30 days.</p>
          </Section>

          <Section title="7. Security">
            <p>We implement industry-standard security measures including encrypted database storage, HTTPS for all data transmission, hashed password storage (bcrypt), and access controls. However, no method of transmission over the internet is 100% secure.</p>
          </Section>

          <Section title="8. Cookies">
            <p>StarLoop uses session cookies for authentication and short-lived cookies to maintain onboarding state. We do not use third-party advertising cookies or tracking pixels.</p>
          </Section>

          <Section title="9. Governing Law">
            <p>This Privacy Policy is governed by the laws of the <strong>Province of Ontario, Canada</strong> and complies with the <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong>.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via email. Continued use of the service after changes constitutes acceptance.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>For privacy-related questions, data access requests, or deletion requests:</p>
            <p><a href="mailto:support@thinkmake.ai">support@thinkmake.ai</a></p>
          </Section>

        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1F1F1F", padding: "24px 48px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#6B7280" }}>
          © {new Date().getFullYear()} StarLoop · <Link href="/en/terms" style={{ color: "#6B7280" }}>Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontSize: "20px", fontWeight: 700, color: "#FFFFFF",
        marginBottom: "16px", paddingBottom: "10px",
        borderBottom: "1px solid #1F1F1F",
      }}>
        {title}
      </h2>
      <div style={{
        fontSize: "15px", color: "#A1A1AA", lineHeight: 1.75,
        display: "flex", flexDirection: "column", gap: "12px",
      }}>
        {children}
      </div>
    </section>
  );
}
