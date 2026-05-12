"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

const LogoSVG = () => (
  <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="15" stroke="url(#grad2)" strokeWidth="2" fill="none"/>
    <path d="M16 8 L17.5 13H22.5L18.5 16L20 21L16 18L12 21L13.5 16L9.5 13H14.5Z" fill="url(#grad2)"/>
    <defs><linearGradient id="grad2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#4B8EF5"/></linearGradient></defs>
  </svg>
);

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

  const inputStyle = {
    border: "1px solid #E8ECEF",
    borderRadius: "8px",
    outline: "none",
    color: "#1A1D23",
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12"
        style={{ background: "linear-gradient(135deg, #1A1D23 0%, #2D2B55 100%)" }}
      >
        <div className="max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <LogoSVG />
            <span className="text-white text-2xl font-bold">StarLoop</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Start collecting
            <br />
            <span style={{ background: "linear-gradient(135deg, #6C63FF, #4B8EF5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              5-star reviews today.
            </span>
          </h2>
          <p className="text-gray-400 mb-10 text-sm leading-relaxed">
            Join local businesses in Toronto growing their reputation with StarLoop.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "#6C63FF" }} />
              <span className="text-gray-300 text-sm">AI-powered review replies</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "#00C9A7" }} />
              <span className="text-gray-300 text-sm">Block bad reviews before Google</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "#4B8EF5" }} />
              <span className="text-gray-300 text-sm">Bilingual — English &amp; Chinese</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: "#F8F9FC" }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <LogoSVG />
            <span className="font-bold text-xl" style={{ color: "#1A1D23" }}>StarLoop</span>
          </div>

          <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #E8ECEF" }}>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>Create your account</h1>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>14-day free trial · No credit card required</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1D23" }}>
                  Your Name <span style={{ color: "#FF4757" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#6C63FF"; e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1D23" }}>
                  Business Name <span style={{ color: "#FF4757" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#6C63FF"; e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="Sunshine Cleaning Co."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1D23" }}>
                  {t("auth.email")} <span style={{ color: "#FF4757" }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#6C63FF"; e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1D23" }}>
                  {t("auth.password")} <span style={{ color: "#FF4757" }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#6C63FF"; e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="Min 6 characters"
                />
              </div>

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "#FFF5F5", color: "#FF4757", border: "1px solid #FFD0D0" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #6C63FF 0%, #4B8EF5 100%)",
                  borderRadius: "10px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? t("common.loading") : t("pricing.startTrial")}
              </button>

              <p className="text-xs text-center" style={{ color: "#6B7280" }}>
                14-day free trial · No credit card required
              </p>
            </form>
          </div>

          <p className="text-center text-sm mt-4" style={{ color: "#6B7280" }}>
            {t("auth.hasAccount")}{" "}
            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "#6C63FF" }}>
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
