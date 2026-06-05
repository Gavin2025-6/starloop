"use client";

import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    missing: "Verification link is missing a token. Please use the link from your email.",
    invalid: "This verification link is invalid or has already been used.",
    server:  "Something went wrong. Please try again or contact support.",
  };

  const errorMsg = error ? (errorMessages[error] ?? errorMessages.server) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#F9FAFB", display: "flex", flexDirection: "column",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ padding: "28px 40px" }}>
        <Logo height={22} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px 80px" }}>
        <div style={{
          width: "100%", maxWidth: "440px",
          background: "#fff", border: "1px solid #E5E7EB",
          borderRadius: "20px", padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}>
          {errorMsg ? (
            <>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "10px" }}>
                Verification failed
              </h1>
              <p style={{ fontSize: "14px", color: "#EF4444", lineHeight: 1.6, marginBottom: "28px" }}>
                {errorMsg}
              </p>
              <Link
                href="/auth/login"
                style={{
                  display: "inline-block", padding: "11px 28px",
                  background: "#0D1117", color: "#fff",
                  borderRadius: "8px", fontSize: "14px", fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "10px" }}>
                Check your email
              </h1>
              <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7, marginBottom: "8px" }}>
                We sent a verification link to your email address. Click the link to activate your account.
              </p>
              <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "32px" }}>
                Didn&apos;t receive it? Check your spam folder, or{" "}
                <Link href="/auth/login" style={{ color: "#0D1117", fontWeight: 600 }}>
                  sign in
                </Link>
                {" "}to resend.
              </p>

              <div style={{
                background: "#F9FAFB", border: "1px solid #E5E7EB",
                borderRadius: "10px", padding: "14px 16px",
                fontSize: "13px", color: "#6B7280", textAlign: "left",
              }}>
                <strong style={{ color: "#374151" }}>Next steps:</strong>
                <ol style={{ margin: "8px 0 0 16px", padding: 0, lineHeight: 2 }}>
                  <li>Open your email inbox</li>
                  <li>Click the link in the email from StarLoop</li>
                  <li>You&apos;ll be redirected to sign in</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
