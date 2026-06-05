import Logo from "@/components/ui/Logo";
import { Link } from "@/i18n/navigation";

export const metadata = {
  title: "Terms of Service — StarLoop",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ color: "#6B7280", fontSize: "15px" }}>Last updated: {updated}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

          <Section title="1. Service Description">
            <p>StarLoop is a reputation management platform that helps local businesses collect customer feedback, manage Google reviews, and respond to service issues proactively. By creating an account, you agree to be bound by these Terms of Service.</p>
            <p>StarLoop provides tools including SMS-based review request delivery, a Service Recovery Protocol for capturing private customer feedback, AI-generated reply drafts, and monthly reputation reporting.</p>
          </Section>

          <Section title="2. User Responsibilities">
            <p>You are responsible for all activity under your account. By using StarLoop, you agree to:</p>
            <ul>
              <li>Provide accurate business and contact information during registration.</li>
              <li>Obtain proper consent from customers before sending SMS or email communications.</li>
              <li>Comply with all applicable laws including anti-spam legislation (Canada&apos;s CASL), TCPA, and Google&apos;s review policies.</li>
              <li>Not use StarLoop to solicit, incentivize, or manipulate customer reviews in violation of Google&apos;s or any other platform&apos;s policies.</li>
              <li>Keep your login credentials secure and notify us immediately of any unauthorized access.</li>
            </ul>
          </Section>

          <Section title="3. Payment Terms">
            <p>StarLoop operates on a prepaid SMS credit system. Credits are purchased in packages and applied to your account balance.</p>
            <ul>
              <li><strong>No subscriptions.</strong> You purchase credits as needed with no recurring charges.</li>
              <li><strong>Credits do not expire</strong> as long as your account is active.</li>
              <li><strong>Refunds:</strong> Used credits are non-refundable. Unused credits may be refunded within 30 days of purchase by contacting <a href="mailto:support@thinkmake.ai">support@thinkmake.ai</a>. Refunds are processed within 5–10 business days.</li>
              <li>All prices are in USD. Stripe processes payments securely and StarLoop does not store payment card information.</li>
            </ul>
          </Section>

          <Section title="4. Account Termination">
            <p>You may cancel your account at any time by contacting <a href="mailto:support@thinkmake.ai">support@thinkmake.ai</a>. Upon cancellation:</p>
            <ul>
              <li>Unused credit balances may be refunded within 30 days of the cancellation request.</li>
              <li>Your data will be deleted within 30 days per our Privacy Policy.</li>
              <li>We reserve the right to terminate or suspend accounts that violate these Terms without prior notice.</li>
            </ul>
          </Section>

          <Section title="5. Disclaimer of Warranties">
            <p>StarLoop is provided &quot;as is&quot; without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
            <p>We do not guarantee that the service will be uninterrupted, error-free, or that any specific business outcome (such as an increase in reviews or ratings) will result from using StarLoop. SMS delivery depends on third-party carriers (Twilio) and cannot be guaranteed in all cases.</p>
          </Section>

          <Section title="6. Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, StarLoop and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including loss of revenue, data, or business opportunities.</p>
          </Section>

          <Section title="7. Governing Law">
            <p>These Terms of Service are governed by and construed in accordance with the laws of the <strong>Province of Ontario, Canada</strong>. Any disputes arising from these Terms shall be resolved in the courts of Ontario.</p>
          </Section>

          <Section title="8. Changes to Terms">
            <p>We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance of the revised Terms. We will notify registered users of material changes by email.</p>
          </Section>

          <Section title="9. Contact">
            <p>If you have questions about these Terms, please contact us at:</p>
            <p><a href="mailto:support@thinkmake.ai">support@thinkmake.ai</a></p>
          </Section>

        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1F1F1F", padding: "24px 48px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#6B7280" }}>
          © {new Date().getFullYear()} StarLoop · <Link href="/en/privacy" style={{ color: "#6B7280" }}>Privacy Policy</Link>
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
