"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    boxSizing: "border-box",
    height: "44px",
    padding: "0 12px",
    fontSize: "0.875rem",
    color: "#000",
    background: "#fff",
    border: `1px solid ${focused === name ? "#000" : "#E5E7EB"}`,
    borderRadius: "6px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 150ms, box-shadow 150ms",
    boxShadow: focused === name ? "0 0 0 3px rgba(0,0,0,0.06)" : "none",
  });

  const btnStyle = (disabled?: boolean): React.CSSProperties => ({
    width: "100%",
    height: "44px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "opacity 150ms",
    fontFamily: "inherit",
  });

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Left — black panel 40% */}
      <div style={{
        flex: "0 0 40%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 64px",
        background: "#000",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: "32px", left: "40px" }}>
          <Logo variant="dark" height={26} />
        </div>
        <div style={{ maxWidth: "400px" }}>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            marginBottom: "20px",
          }}>
            No worries, we&apos;ve got you
          </h1>
          <p style={{
            fontSize: "0.9375rem", color: "#9CA3AF", lineHeight: 1.6,
            marginBottom: "48px",
          }}>
            Enter your email and we&apos;ll send a reset link — fast and secure.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              { title: "Secure reset", desc: "Your password is hashed and never stored in plain text." },
              { title: "One-hour link", desc: "The reset link expires after 1 hour for your safety." },
              { title: "Back in minutes", desc: "Once reset, sign in with your new password right away." },
            ].map(({ title, desc }) => (
              <div key={title} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>{title}</div>
                  <div style={{ fontSize: "0.8125rem", color: "#9CA3AF", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — white panel 60% */}
      <div style={{
        flex: "0 0 60%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        padding: "40px",
      }}>
        <div style={{ width: "360px" }}>
          {submitted ? (
            <>
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: "#F0FDF4", display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: "20px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{
                fontSize: "1.5rem", fontWeight: 700, color: "#000",
                letterSpacing: "-0.02em", marginBottom: "8px",
              }}>
                Check your email
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "28px", lineHeight: 1.6 }}>
                If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
              </p>
              <Link
                href="/auth/login"
                style={{
                  display: "inline-block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#000",
                  textDecoration: "none",
                }}
              >
                &larr; Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h2 style={{
                fontSize: "1.5rem", fontWeight: 700, color: "#000",
                letterSpacing: "-0.02em", marginBottom: "8px",
              }}>
                Forgot password?
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "28px" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{
                    display: "block", fontSize: "0.75rem", fontWeight: 500,
                    color: "#374151", marginBottom: "6px",
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    placeholder="you@example.com"
                    style={inputStyle("email")}
                  />
                </div>
                {error && (
                  <div style={{
                    padding: "10px 14px", borderRadius: "6px",
                    background: "#FEF2F2", border: "1px solid #FECACA",
                    fontSize: "0.8125rem", color: "#DC2626",
                  }}>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={btnStyle(loading)}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = "1"; }}
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#6B7280", marginTop: "24px" }}>
                <Link href="/auth/login" style={{ color: "#000", fontWeight: 600, textDecoration: "none" }}>
                  &larr; Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
