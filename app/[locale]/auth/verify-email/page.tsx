"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Email may be passed from register page — pre-fill so user doesn't have to retype
  const emailParam = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);

  // If email comes from URL, also sync after hydration (for SSR/Suspense edge case)
  useEffect(() => {
    if (emailParam && !email) setEmail(emailParam);
  }, [emailParam, email]);

  const [sending, setSending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  const errorMessages: Record<string, string> = {
    missing: "Verification link is missing a token. Please use the Resend button below.",
    invalid: "This link is invalid or has already been used. Please request a new one below.",
    server:  "Something went wrong. Please try again or contact support@thinkmake.ai",
  };
  const errorMsg = error ? (errorMessages[error] ?? errorMessages.server) : null;

  async function handleResend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setResendError("");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setResent(true);
    } catch {
      setResendError("Failed to resend. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const knownEmail = !!emailParam;

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
            /* ── Error / invalid token ── */
            <>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "10px" }}>
                Verification link expired
              </h1>
              <p style={{ fontSize: "14px", color: "#EF4444", lineHeight: 1.6, marginBottom: "24px" }}>
                {errorMsg}
              </p>

              {/* Resend directly if we know the email; otherwise show input */}
              {!resent ? (
                knownEmail ? (
                  <div style={{ textAlign: "left", marginBottom: "20px" }}>
                    <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>
                      Send a new verification link to <strong style={{ color: "#0D1117" }}>{email}</strong>:
                    </p>
                    <button
                      onClick={() => handleResend()}
                      disabled={sending}
                      style={{
                        width: "100%", height: "40px",
                        background: "#0D1117", color: "#fff",
                        border: "none", borderRadius: "8px",
                        fontSize: "14px", fontWeight: 600,
                        cursor: sending ? "not-allowed" : "pointer",
                        opacity: sending ? 0.6 : 1,
                      }}
                    >
                      {sending ? "Sending…" : "Resend verification email"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResend} style={{ textAlign: "left", marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                      Enter your email to resend
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{ flex: 1, height: "40px", padding: "0 12px", fontSize: "14px", border: "1px solid #E5E7EB", borderRadius: "8px", outline: "none" }}
                      />
                      <button type="submit" disabled={sending} style={{ height: "40px", padding: "0 16px", background: "#0D1117", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1, whiteSpace: "nowrap" }}>
                        {sending ? "…" : "Resend"}
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <div style={{ padding: "12px 16px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: "8px", fontSize: "14px", color: "#065F46", marginBottom: "20px" }}>
                  ✅ New verification email sent! Check your inbox.
                </div>
              )}

              {resendError && <p style={{ fontSize: "12px", color: "#EF4444", marginBottom: "12px" }}>{resendError}</p>}

              <Link href="/auth/login" style={{ display: "inline-block", padding: "11px 28px", background: "#F3F4F6", color: "#374151", borderRadius: "8px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
                Back to sign in
              </Link>
            </>
          ) : (
            /* ── Check email (normal flow after registration) ── */
            <>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "10px" }}>
                Check your email
              </h1>

              {knownEmail ? (
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7, marginBottom: "24px" }}>
                  We sent a verification link to <strong style={{ color: "#0D1117" }}>{email}</strong>.<br />
                  Click the link to activate your account, then sign in.
                </p>
              ) : (
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7, marginBottom: "24px" }}>
                  We sent a verification link to your email address.<br />
                  Click the link to activate your account, then sign in.
                </p>
              )}

              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "14px 16px", fontSize: "13px", color: "#6B7280", textAlign: "left", marginBottom: "24px" }}>
                <strong style={{ color: "#374151" }}>Didn&apos;t receive it?</strong>
                <ul style={{ margin: "6px 0 0 16px", padding: 0, lineHeight: 2 }}>
                  <li>Check your <strong>spam / junk</strong> folder</li>
                  <li>Wait up to 2 minutes and refresh</li>
                  <li>Use the button below to resend</li>
                </ul>
              </div>

              {/* Resend section — no email input needed when we already know it */}
              {!resent ? (
                knownEmail ? (
                  <button
                    onClick={() => handleResend()}
                    disabled={sending}
                    style={{ width: "100%", height: "42px", background: "#0D1117", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1, marginBottom: "16px" }}
                  >
                    {sending ? "Sending…" : "Resend verification email"}
                  </button>
                ) : (
                  <form onSubmit={handleResend} style={{ textAlign: "left", marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Resend to a different email</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ flex: 1, height: "40px", padding: "0 12px", fontSize: "14px", border: "1px solid #E5E7EB", borderRadius: "8px", outline: "none" }} />
                      <button type="submit" disabled={sending} style={{ height: "40px", padding: "0 16px", background: "#0D1117", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                        {sending ? "…" : "Resend"}
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <div style={{ padding: "12px 16px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: "8px", fontSize: "14px", color: "#065F46", marginBottom: "16px" }}>
                  ✅ Verification email resent! Check your inbox.
                </div>
              )}

              {resendError && <p style={{ fontSize: "12px", color: "#EF4444" }}>{resendError}</p>}

              <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "16px" }}>
                Already verified?{" "}
                <Link href="/auth/login" style={{ color: "#0D1117", fontWeight: 600 }}>Sign in →</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
