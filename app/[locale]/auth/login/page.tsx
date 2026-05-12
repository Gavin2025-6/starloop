"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

const LogoSVG = () => (
  <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="15" stroke="url(#grad)" strokeWidth="2" fill="none"/>
    <path d="M16 8 L17.5 13H22.5L18.5 16L20 21L16 18L12 21L13.5 16L9.5 13H14.5Z" fill="url(#grad)"/>
    <defs><linearGradient id="grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#4B8EF5"/></linearGradient></defs>
  </svg>
);

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("auth.loginError"));
    } else {
      router.push(`/${locale}/dashboard`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Left panel - hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12"
        style={{ background: "linear-gradient(135deg, #1A1D23 0%, #2D2B55 100%)" }}
      >
        <div className="max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <LogoSVG />
            <span className="text-white text-2xl font-bold">StarLoop</span>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Get more 5-star reviews.
            <br />
            <span style={{ background: "linear-gradient(135deg, #6C63FF, #4B8EF5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Automatically.
            </span>
          </h2>
          <p className="text-gray-400 mb-10 text-sm leading-relaxed">
            Trusted by Toronto local businesses to grow their reputation.
          </p>

          {/* Feature bullets */}
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
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>Welcome back</h1>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Sign in to your StarLoop account</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1D23" }}>
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={{
                    border: "1px solid #E8ECEF",
                    borderRadius: "8px",
                    outline: "none",
                    color: "#1A1D23",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#6C63FF"; e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1D23" }}>
                  {t("auth.password")}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm transition-all"
                  style={{
                    border: "1px solid #E8ECEF",
                    borderRadius: "8px",
                    outline: "none",
                    color: "#1A1D23",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#6C63FF"; e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  placeholder="••••••••"
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
                {loading ? t("common.loading") : t("auth.signIn")}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-4" style={{ color: "#6B7280" }}>
            {t("auth.noAccount")}{" "}
            <Link href="/auth/register" className="font-medium hover:underline" style={{ color: "#6C63FF" }}>
              {t("auth.signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
