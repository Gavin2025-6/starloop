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

          {/* Google social login */}
          <a
            href="/api/google/connect"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              width: "100%", height: "44px",
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              fontSize: "0.875rem", fontWeight: 500,
              color: "#000",
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "none",
              transition: "border-color 150ms",
              marginBottom: "20px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#000"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            marginBottom: "20px",
          }}>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }}/>
            <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>or continue with email</span>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }}/>
          </div>

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
