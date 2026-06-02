"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push(`/${locale}/dashboard`);
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
            Turn customer feedback into action
          </h1>
          <p style={{
            fontSize: "0.9375rem", color: "#9CA3AF", lineHeight: 1.6,
            marginBottom: "48px",
          }}>
            StarLoop watches your reviews, flags problems, and helps you respond — so nothing slips through.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              { title: "Auto-send review requests", desc: "Customers get an SMS or email at the perfect moment." },
              { title: "Recover unhappy customers", desc: "Flag issues early and give owners clear next steps." },
              { title: "Weekly reputation reports", desc: "See what's moving your rating and what to fix first." },
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
          <h2 style={{
            fontSize: "1.5rem", fontWeight: 700, color: "#000",
            letterSpacing: "-0.02em", marginBottom: "8px",
          }}>
            Sign in
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "28px" }}>
            Enter your email and password to continue.
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
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="you@example.com"
                style={inputStyle("email")}
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{
                  display: "block", fontSize: "0.75rem", fontWeight: 500,
                  color: "#374151",
                }}>
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  style={{ fontSize: "0.75rem", color: "#6B7280", textDecoration: "none" }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                name="current-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                style={inputStyle("password")}
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#6B7280", marginTop: "24px" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" style={{ color: "#000", fontWeight: 600, textDecoration: "none" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
