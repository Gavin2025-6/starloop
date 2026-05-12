"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

const LogoSVG = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rl-star" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00C9A7"/>
        <stop offset="100%" stopColor="#4A6FFF"/>
      </linearGradient>
      <linearGradient id="rl-orbit" x1="34" y1="34" x2="0" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#4A6FFF" stopOpacity="0.8"/>
      </linearGradient>
    </defs>
    <ellipse cx="17" cy="17" rx="14" ry="7" stroke="url(#rl-orbit)" strokeWidth="1.5" fill="none"
      strokeDasharray="44 44" strokeDashoffset="22" transform="rotate(-30 17 17)"/>
    <path d="M26.5 10.5 L28 13 L25 12.5Z" fill="url(#rl-orbit)"/>
    <path d="M17 5.5 L18.8 11.8H25.4L20.1 15.6L21.9 21.9L17 18.1L12.1 21.9L13.9 15.6L8.6 11.8H15.2Z"
      stroke="url(#rl-star)" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
    <path d="M27 5 L27.6 6.8 L29.4 7.4 L27.6 8 L27 9.8 L26.4 8 L24.6 7.4 L26.4 6.8Z" fill="#00C9A7"/>
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
    color: "#0D1B3E",
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-center px-14"
        style={{ background: "linear-gradient(160deg, #0D1B3E 0%, #1a1a4e 100%)" }}
      >
        <div className="max-w-sm">
          <div className="flex items-center gap-3 mb-12">
            <LogoSVG size={44} />
            <span className="font-semibold text-2xl" style={{ letterSpacing: "-0.3px" }}>
              <span style={{ color: "#ffffff" }}>star</span>
              <span style={{
                background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>loop</span>
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Start collecting
            <br />
            <span style={{
              background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              5-star reviews today.
            </span>
          </h2>
          <p className="mb-12 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Join local businesses in Toronto growing their Google reputation with StarLoop.
          </p>

          <div className="space-y-5">
            {[
              { dot: "#00C9A7", text: "AI-powered review replies in seconds" },
              { dot: "#4A6FFF", text: "Block bad reviews before they hit Google" },
              { dot: "#00C9A7", text: "Bilingual — English & 中文" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.dot }} />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: "#F8F9FC" }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <LogoSVG size={36} />
            <span className="font-semibold text-xl" style={{ letterSpacing: "-0.2px" }}>
              <span style={{ color: "#0D1B3E" }}>star</span>
              <span style={{
                background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>loop</span>
            </span>
          </div>

          <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #E8ECEF" }}>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#0D1B3E" }}>Create your account</h1>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>14-day free trial · No credit card required</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0D1B3E" }}>
                  Your Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0D1B3E" }}>
                  Business Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="Sunshine Cleaning Co."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0D1B3E" }}>
                  {t("auth.email")} <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0D1B3E" }}>
                  {t("auth.password")} <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="Min 6 characters"
                />
              </div>

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "#FFF5F5", color: "#EF4444", border: "1px solid #FECACA" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #00C9A7 0%, #4A6FFF 100%)",
                  borderRadius: "10px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? t("common.loading") : t("pricing.startTrial")}
              </button>

              <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
                14-day free trial · No credit card required
              </p>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "#E8ECEF" }} />
              <span className="text-xs" style={{ color: "#9CA3AF" }}>or sign up with</span>
              <div className="flex-1 h-px" style={{ background: "#E8ECEF" }} />
            </div>

            {/* Google placeholder */}
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{
                border: "1px solid #E8ECEF",
                borderRadius: "10px",
                color: "#6B7280",
                background: "#fff",
                cursor: "not-allowed",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google (coming soon)
            </button>
          </div>

          <p className="text-center text-sm mt-4" style={{ color: "#6B7280" }}>
            {t("auth.hasAccount")}{" "}
            <Link href="/auth/login" className="font-medium hover:underline" style={{ color: "#4A6FFF" }}>
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
