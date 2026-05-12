"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

function LogoMark({ variant = "light", height = 32 }: { variant?: "dark" | "light"; height?: number }) {
  const iconSize = Math.round(height * 1.1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(height * 0.3) }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rl-star" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C9A7"/><stop offset="100%" stopColor="#4A6FFF"/>
          </linearGradient>
          <linearGradient id="rl-orbit" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.85"/><stop offset="100%" stopColor="#4A6FFF" stopOpacity="0.85"/>
          </linearGradient>
          <marker id="rl-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#4A6FFF" opacity="0.85"/>
          </marker>
        </defs>
        <ellipse cx="22" cy="22" rx="18" ry="9" stroke="url(#rl-orbit)" strokeWidth="2" fill="none"
          strokeDasharray="56 56" strokeDashoffset="28" transform="rotate(-25 22 22)" markerEnd="url(#rl-arrow)"/>
        <path d="M22 4 L24.1 15H35.1L26.4 21.5L29.5 32.5L22 26.1L14.5 32.5L17.6 21.5L8.9 15H19.9Z"
          stroke="url(#rl-star)" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
        <path d="M38 2 L39 5 L42 6 L39 7 L38 10 L37 7 L34 6 L37 5Z" fill="#00C9A7"/>
      </svg>
      <span style={{ fontWeight: 700, fontSize: Math.round(height * 0.7), lineHeight: 1 }}>
        <span style={{ color: variant === "dark" ? "#FFFFFF" : "#0D1117" }}>star</span>
        <span style={{ color: "#00C9A7" }}>loop</span>
      </span>
    </div>
  );
}

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, businessName, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("auth.registerError"));
    } else {
      router.push(`/${locale}/onboarding`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      {/* LEFT panel — 45% width, dark background */}
      <div className="hidden lg:flex flex-col" style={{ width: "45%", background: "#0A0A0A", padding: "48px" }}>
        {/* Top: Logo */}
        <LogoMark variant="dark" height={28} />

        {/* Middle: tagline + bullets */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "380px" }}>
          <h2 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2, marginBottom: "12px" }}>
            Create your account
          </h2>
          <p style={{ fontSize: "1.125rem", fontWeight: 500, color: "#00C9A7", marginBottom: "32px" }}>
            Start free today.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              "Block negative reviews before they reach Google",
              "AI replies powered by Claude, not GPT",
              "Bilingual EN/中文, built for Toronto",
            ].map((text) => (
              <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00C9A7", flexShrink: 0, marginTop: "8px" }} />
                <span style={{ fontSize: "0.875rem", color: "#A1A1AA", lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: copyright */}
        <p style={{ fontSize: "0.75rem", color: "#4F4F4F" }}>© 2026 StarLoop</p>
      </div>

      {/* RIGHT panel — white, flex-1 */}
      <div style={{ flex: 1, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <LogoMark variant="light" height={28} />
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0D1117", marginBottom: "4px" }}>
            Create your account
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "32px" }}>
            Start getting more 5-star reviews today
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                style={{
                  width: "100%", border: "1px solid #E5E7EB", borderRadius: "8px",
                  padding: "12px 16px", fontSize: "0.875rem", color: "#0D1117",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px #0D1117"; e.target.style.borderColor = "transparent"; }}
                onBlur={(e) => { e.target.style.boxShadow = "none"; e.target.style.borderColor = "#E5E7EB"; }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                Business Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Sunshine Cleaning Co."
                style={{
                  width: "100%", border: "1px solid #E5E7EB", borderRadius: "8px",
                  padding: "12px 16px", fontSize: "0.875rem", color: "#0D1117",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px #0D1117"; e.target.style.borderColor = "transparent"; }}
                onBlur={(e) => { e.target.style.boxShadow = "none"; e.target.style.borderColor = "#E5E7EB"; }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                {t("auth.email")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%", border: "1px solid #E5E7EB", borderRadius: "8px",
                  padding: "12px 16px", fontSize: "0.875rem", color: "#0D1117",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px #0D1117"; e.target.style.borderColor = "transparent"; }}
                onBlur={(e) => { e.target.style.boxShadow = "none"; e.target.style.borderColor = "#E5E7EB"; }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                {t("auth.password")}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", border: "1px solid #E5E7EB", borderRadius: "8px",
                  padding: "12px 16px", fontSize: "0.875rem", color: "#0D1117",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px #0D1117"; e.target.style.borderColor = "transparent"; }}
                onBlur={(e) => { e.target.style.boxShadow = "none"; e.target.style.borderColor = "#E5E7EB"; }}
              />
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px", fontSize: "0.875rem", color: "#EF4444" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#0D1117", color: "#FFFFFF", border: "none",
                borderRadius: "8px", padding: "12px", fontSize: "0.875rem",
                fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1, width: "100%", marginTop: "8px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.background = "#1a1a1a"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "#0D1117"; }}
            >
              {loading ? t("common.loading") : t("pricing.startTrial")}
            </button>

            <p className="text-xs text-center" style={{ color: "#9CA3AF", marginTop: "4px" }}>
              By creating an account, you agree to our Terms and Privacy Policy
            </p>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
            <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
          </div>

          {/* Google button (disabled) */}
          <button
            disabled
            style={{
              border: "1px solid #E5E7EB", borderRadius: "8px", background: "#FFFFFF",
              width: "100%", padding: "12px", fontSize: "0.875rem", color: "#6B7280",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              cursor: "not-allowed", opacity: 0.6,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google · Coming soon
          </button>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#6B7280", marginTop: "24px" }}>
            {t("auth.hasAccount")}{" "}
            <Link href="/auth/login" style={{ color: "#0D1117", fontWeight: 500, textDecoration: "none" }}
              className="hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
