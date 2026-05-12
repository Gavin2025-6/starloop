import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

// Inline logo SVG (server component — no separate file needed)
const LogoIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lp-star" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00C9A7"/>
        <stop offset="100%" stopColor="#4A6FFF"/>
      </linearGradient>
      <linearGradient id="lp-orbit" x1="34" y1="34" x2="0" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#4A6FFF" stopOpacity="0.8"/>
      </linearGradient>
    </defs>
    <ellipse cx="17" cy="17" rx="14" ry="7" stroke="url(#lp-orbit)" strokeWidth="1.5" fill="none"
      strokeDasharray="44 44" strokeDashoffset="22" transform="rotate(-30 17 17)"/>
    <path d="M26.5 10.5 L28 13 L25 12.5Z" fill="url(#lp-orbit)"/>
    <path d="M17 5.5 L18.8 11.8H25.4L20.1 15.6L21.9 21.9L17 18.1L12.1 21.9L13.9 15.6L8.6 11.8H15.2Z"
      stroke="url(#lp-star)" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
    <path d="M27 5 L27.6 6.8 L29.4 7.4 L27.6 8 L27 9.8 L26.4 8 L24.6 7.4 L26.4 6.8Z" fill="#00C9A7"/>
  </svg>
);

const Wordmark = ({ light = false }: { light?: boolean }) => (
  <span className="font-semibold text-lg" style={{ letterSpacing: "-0.2px" }}>
    <span style={{ color: light ? "#ffffff" : "#0D1B3E" }}>star</span>
    <span style={{
      background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}>loop</span>
  </span>
);

export default async function LandingPage() {
  const t = await getTranslations();

  return (
    <div
      className="min-h-screen"
      style={{ background: "#FFFFFF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* ── Sticky Navbar ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #E8ECEF",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <LogoIcon size={30} />
          <Wordmark />
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/auth/login"
            className="text-sm font-medium no-underline hidden sm:block"
            style={{ color: "#6B7280" }}
          >
            {t("auth.signIn")}
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-semibold px-4 py-2 text-white no-underline transition-opacity hover:opacity-90 rounded-xl"
            style={{ background: "linear-gradient(135deg, #00C9A7 0%, #4A6FFF 100%)" }}
          >
            {t("pricing.startTrial")}
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0D1B3E 0%, #1a1a4e 60%, #0D1B3E 100%)" }}
      >
        {/* Background orbs */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #00C9A7, transparent)", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #4A6FFF, transparent)", transform: "translate(-30%, 30%)" }}
        />

        <div className="max-w-5xl mx-auto px-6 pt-20 pb-28 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(0,201,167,0.15)", color: "#00C9A7", border: "1px solid rgba(0,201,167,0.25)" }}
              >
                <span>🇨🇦</span>
                <span>Built for Toronto small businesses</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                把好服务，变成好口碑
              </h1>
              <h2
                className="text-2xl lg:text-3xl font-bold mb-5 leading-tight"
                style={{
                  background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Turn Great Service Into 5-Star Reviews
              </h2>
              <p className="text-base mb-1.5" style={{ color: "#9CA3AF" }}>
                AI帮你管评价、拦差评、自动回复。
              </p>
              <p className="text-sm mb-8" style={{ color: "#6B7280" }}>
                $39/mo · AI-powered review management for local businesses.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/auth/register"
                  className="text-sm font-semibold px-6 py-3.5 rounded-xl no-underline transition-all hover:opacity-90 text-center"
                  style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", color: "#fff" }}
                >
                  {t("pricing.startTrial")} →
                </Link>
                <a
                  href="#features"
                  className="text-sm font-medium px-6 py-3.5 rounded-xl no-underline transition-colors text-center"
                  style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
                >
                  See how it works
                </a>
              </div>

              <p className="text-xs mt-4" style={{ color: "#4B5563" }}>
                {t("pricing.noContract")} · {t("pricing.cancelAnytime")}
              </p>
            </div>

            {/* Right: mock dashboard card */}
            <div className="flex-1 lg:max-w-sm w-full">
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {/* Browser chrome dots */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#EF4444" }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
                  <span className="text-xs ml-2" style={{ color: "#6B7280" }}>starloop.app/dashboard</span>
                </div>

                {/* Mock stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: "Total Reviews", value: "147", color: "#00C9A7" },
                    { label: "Avg Rating", value: "4.8★", color: "#4A6FFF" },
                    { label: "Requests Sent", value: "52", color: "#00C9A7" },
                    { label: "Needs Reply", value: "3", color: "#4A6FFF" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="text-base font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Mock review card */}
                <div
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)" }}
                    >S</div>
                    <div>
                      <div className="text-xs font-medium text-white">Sarah K.</div>
                      <div className="text-xs" style={{ color: "#F59E0B" }}>★★★★★</div>
                    </div>
                    <div className="ml-auto">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(0,201,167,0.2)", color: "#00C9A7" }}
                      >AI Replied</span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    Amazing service! They did an incredible job. Will definitely come back!
                  </p>
                </div>

                {/* Review gate preview */}
                <div
                  className="mt-3 rounded-xl p-3 flex items-center gap-3"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}
                  >M</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>2★ review blocked</div>
                    <div className="text-xs" style={{ color: "#6B7280" }}>Sent to private inbox instead</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(99,102,241,0.2)", color: "#A5B4FC" }}>🛡️ Gated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <section className="py-8" style={{ background: "#F8F9FC", borderBottom: "1px solid #E8ECEF" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest mb-5" style={{ color: "#9CA3AF" }}>
            Trusted by local businesses in Toronto
          </p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            {/* Google */}
            <div className="flex items-center gap-2 opacity-60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-medium" style={{ color: "#6B7280" }}>Google Reviews</span>
            </div>
            {/* Yelp */}
            <div className="flex items-center gap-2 opacity-60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF1A1A">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l7 4.5-7 4.5z"/>
              </svg>
              <span className="text-sm font-medium" style={{ color: "#6B7280" }}>Yelp</span>
            </div>
            {/* Facebook */}
            <div className="flex items-center gap-2 opacity-60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium" style={{ color: "#6B7280" }}>Facebook</span>
            </div>
            {/* Business types */}
            <div className="hidden sm:flex items-center gap-5" style={{ color: "#9CA3AF", fontSize: "13px" }}>
              {["🧹 Cleaning", "🌿 Landscaping", "🍜 Restaurant", "💅 Nail Salon"].map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features 3-column ── */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#0D1B3E" }}>
            Everything you need to dominate local search
          </h2>
          <p className="text-base" style={{ color: "#6B7280" }}>Built for Toronto businesses. Priced for real people.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🛡️",
              iconBg: "linear-gradient(135deg, rgba(0,201,167,0.12), rgba(74,111,255,0.12))",
              title: "Review Gate™",
              titleZh: "差评永远不上Google",
              desc: "Happy customers go to Google. Unhappy ones get a private form — so you can fix it first, before the damage is done.",
              badge: "Patented",
              badgeBg: "rgba(0,201,167,0.1)",
              badgeColor: "#00C9A7",
            },
            {
              icon: "🤖",
              iconBg: "linear-gradient(135deg, rgba(74,111,255,0.12), rgba(0,201,167,0.12))",
              title: "Claude AI Replies",
              titleZh: "30秒生成专业回复",
              desc: "Claude AI reads each review and writes a professional, on-brand reply. Edit and publish in one click. Both English and Chinese.",
              badge: "Powered by Claude",
              badgeBg: "rgba(74,111,255,0.1)",
              badgeColor: "#4A6FFF",
            },
            {
              icon: "🌐",
              iconBg: "linear-gradient(135deg, rgba(0,201,167,0.12), rgba(74,111,255,0.08))",
              title: "Bilingual Support",
              titleZh: "中英文全支持",
              desc: "Full English + Chinese (Simplified) interface. Reach your entire community — no language barrier.",
              badge: "EN + 中文",
              badgeBg: "rgba(0,201,167,0.1)",
              badgeColor: "#00C9A7",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6"
              style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: f.iconBg }}
                >
                  {f.icon}
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: f.badgeBg, color: f.badgeColor }}
                >
                  {f.badge}
                </span>
              </div>
              <h3 className="font-bold text-base mb-0.5" style={{ color: "#0D1B3E" }}>{f.titleZh}</h3>
              <p className="text-xs mb-3" style={{ color: "#4A6FFF" }}>{f.title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Deep-dive 1: Review Gate ── */}
      <section className="py-20" style={{ background: "#F8F9FC" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            {/* SMS mock */}
            <div className="flex-1 lg:max-w-xs">
              <div
                className="rounded-3xl p-6 mx-auto"
                style={{
                  background: "linear-gradient(160deg, #0D1B3E, #1a1a4e)",
                  maxWidth: "280px",
                  boxShadow: "0 20px 60px rgba(13,27,62,0.3)",
                }}
              >
                <div className="text-center mb-4">
                  <div className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Messages</div>
                  <div className="text-sm font-semibold text-white">Sunshine Cleaning</div>
                </div>
                {/* SMS bubbles */}
                <div className="space-y-3">
                  <div
                    className="rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", maxWidth: "85%" }}
                  >
                    Hi Sarah! How was your cleaning today? We&apos;d love your feedback 🙏
                  </div>
                  <div
                    className="rounded-2xl rounded-br-sm px-4 py-2.5 text-xs ml-auto text-right"
                    style={{
                      background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
                      color: "#fff",
                      maxWidth: "75%",
                    }}
                  >
                    It was amazing! 5 stars!
                  </div>
                  <div
                    className="rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", maxWidth: "90%" }}
                  >
                    That&apos;s wonderful! Tap here to share on Google → ⭐⭐⭐⭐⭐
                  </div>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-4"
                style={{ background: "rgba(0,201,167,0.08)", color: "#00C9A7", border: "1px solid rgba(0,201,167,0.2)" }}
              >
                🛡️ Review Gate™
              </div>
              <h2 className="text-3xl font-bold mb-4 leading-tight" style={{ color: "#0D1B3E" }}>
                Stop bad reviews<br />before they go live
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: "#6B7280" }}>
                When customers rate 4–5★ they&apos;re sent directly to Google. When they rate 1–3★, they see a private form instead — so you can resolve it before it goes public.
              </p>
              <div className="space-y-3">
                {[
                  "SMS & email review requests in 2 clicks",
                  "Smart routing — good reviews to Google, bad ones to you",
                  "Track every request: sent → delivered → clicked → reviewed",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", color: "#fff" }}
                    >✓</div>
                    <span className="text-sm" style={{ color: "#374151" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deep-dive 2: AI Replies ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-14">
            {/* AI reply UI mock */}
            <div className="flex-1 lg:max-w-sm w-full">
              <div
                className="bg-white rounded-2xl p-5"
                style={{ border: "1px solid #E8ECEF", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
              >
                {/* Review card mock */}
                <div
                  className="rounded-xl p-4 mb-4"
                  style={{ background: "#F0FFF4", border: "1px solid #A7F3D0" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)" }}
                    >J</div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#0D1B3E" }}>Jimmy L.</div>
                      <div className="text-xs" style={{ color: "#F59E0B" }}>★★★★★</div>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "#374151" }}>
                    Best cleaning service in Toronto! Very professional and thorough. Highly recommend!
                  </p>
                </div>
                {/* Draft reply */}
                <div>
                  <div className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                    AI Draft Reply
                  </div>
                  <div
                    className="rounded-xl p-3 text-xs leading-relaxed mb-3"
                    style={{ background: "#F8F9FC", border: "1px solid #E8ECEF", color: "#374151" }}
                  >
                    Thank you so much, Jimmy! We&apos;re thrilled to hear you had such a great experience. Our team takes pride in delivering thorough, professional service every time. We look forward to serving you again! ⭐
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-xs font-semibold px-4 py-2 rounded-lg text-white"
                      style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", border: "none", cursor: "default" }}
                    >
                      ✓ Publish to Google
                    </button>
                    <button
                      className="text-xs px-3 py-2 rounded-lg"
                      style={{ background: "#F8F9FC", color: "#6B7280", border: "1px solid #E8ECEF", cursor: "default" }}
                    >
                      ↻ Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-4"
                style={{ background: "rgba(74,111,255,0.08)", color: "#4A6FFF", border: "1px solid rgba(74,111,255,0.2)" }}
              >
                🤖 Claude AI
              </div>
              <h2 className="text-3xl font-bold mb-4 leading-tight" style={{ color: "#0D1B3E" }}>
                Professional replies<br />in 30 seconds
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: "#6B7280" }}>
                Claude AI reads each review in context and writes a warm, professional reply in your voice. Edit if you want, publish with one click — in English or Chinese.
              </p>
              <div className="space-y-3">
                {[
                  "One-click AI reply generation with Claude",
                  "Automatically matches tone: formal or friendly",
                  "Bilingual — reply in English, Chinese, or both",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", color: "#fff" }}
                    >✓</div>
                    <span className="text-sm" style={{ color: "#374151" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24" style={{ background: "#F8F9FC" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#0D1B3E" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ color: "#6B7280" }}>Way less than Birdeye ($299/mo) or Podium ($399/mo)</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                name: "Free",
                nameZh: "免费版",
                price: "$0",
                features: ["10 SMS/month", "Review Gate™", "Private feedback inbox", "Basic dashboard"],
                cta: "Get Started Free",
                href: "/auth/register",
                highlight: false,
                badge: null,
              },
              {
                name: "Starter",
                nameZh: "基础版",
                price: "$39",
                features: ["Unlimited SMS & email", "AI reply generation", "Google Business sync", "Monthly AI reports", "Priority support"],
                cta: t("pricing.startTrial"),
                href: "/auth/register",
                highlight: true,
                badge: "Most Popular",
              },
              {
                name: "Pro",
                nameZh: "专业版",
                price: "$79",
                features: ["Up to 5 locations", "Everything in Starter", "Advanced analytics", "White-label reports", "Dedicated onboarding"],
                cta: "Coming Soon",
                href: "#",
                highlight: false,
                badge: null,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-6 relative"
                style={{
                  background: plan.highlight ? "linear-gradient(135deg, #00C9A7 0%, #4A6FFF 100%)" : "#fff",
                  border: plan.highlight ? "none" : "1px solid #E8ECEF",
                  boxShadow: plan.highlight ? "0 8px 40px rgba(0,201,167,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap"
                    style={{ background: "#0D1B3E", color: "#fff" }}
                  >
                    {plan.badge}
                  </div>
                )}
                <div className="text-sm font-semibold mb-0.5" style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : "#6B7280" }}>
                  {plan.nameZh}
                </div>
                <div className="text-base font-bold mb-1" style={{ color: plan.highlight ? "#fff" : "#0D1B3E" }}>
                  {plan.name}
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: plan.highlight ? "#fff" : "#0D1B3E" }}>
                  {plan.price}
                  <span className="text-sm font-normal" style={{ opacity: 0.65 }}>
                    {t("pricing.perMonth")}
                  </span>
                </div>
                <ul className="my-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm flex items-center gap-2"
                      style={{ color: plan.highlight ? "rgba(255,255,255,0.85)" : "#6B7280" }}
                    >
                      <span style={{ color: plan.highlight ? "#fff" : "#00C9A7", fontWeight: "bold" }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="block text-center py-3 px-6 rounded-xl font-semibold text-sm no-underline transition-opacity hover:opacity-90"
                  style={
                    plan.highlight
                      ? { background: "#fff", color: "#00C9A7" }
                      : plan.href === "#"
                      ? { background: "#F0F0F5", color: "#9CA3AF", pointerEvents: "none" }
                      : { background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", color: "#fff" }
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Competitor Table ── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#0D1B3E" }}>How we compare</h2>
          <p className="text-sm" style={{ color: "#6B7280" }}>StarLoop vs the big guys</p>
        </div>
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8F9FC", borderBottom: "1px solid #E8ECEF" }}>
                <th className="px-5 py-4 text-left text-xs font-medium" style={{ color: "#6B7280" }}>Feature</th>
                <th className="px-5 py-4 text-center text-xs font-semibold" style={{ color: "#00C9A7" }}>StarLoop</th>
                <th className="px-5 py-4 text-center text-xs font-medium" style={{ color: "#6B7280" }}>Birdeye</th>
                <th className="px-5 py-4 text-center text-xs font-medium" style={{ color: "#6B7280" }}>Podium</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Price", sl: "$39/mo", bird: "$299/mo", pod: "$399/mo", highlight: true },
                { feature: "Review Gate™", sl: "✓", bird: "✗", pod: "✗", highlight: false },
                { feature: "AI Reply Generation", sl: "✓ Claude", bird: "✓", pod: "✓", highlight: false },
                { feature: "Bilingual (EN + 中文)", sl: "✓", bird: "✗", pod: "✗", highlight: false },
                { feature: "Local Business Focus", sl: "✓ Toronto", bird: "Enterprise", pod: "Enterprise", highlight: false },
                { feature: "Monthly AI Reports", sl: "✓", bird: "✓", pod: "✓", highlight: false },
                { feature: "Setup time", sl: "< 5 min", bird: "Hours", pod: "Hours", highlight: true },
              ].map((row) => (
                <tr key={row.feature} style={{ borderBottom: "1px solid #F8F9FC" }} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "#374151" }}>{row.feature}</td>
                  <td className="px-5 py-3.5 text-center text-sm font-semibold" style={{ color: row.highlight ? "#00C9A7" : "#10B981" }}>{row.sl}</td>
                  <td className="px-5 py-3.5 text-center text-sm" style={{ color: row.bird === "✗" ? "#EF4444" : "#6B7280" }}>{row.bird}</td>
                  <td className="px-5 py-3.5 text-center text-sm" style={{ color: row.pod === "✗" ? "#EF4444" : "#6B7280" }}>{row.pod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Case Studies (placeholder) ── */}
      <section className="py-16" style={{ background: "#F8F9FC" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0D1B3E" }}>Customer stories</h2>
          <p className="text-sm mb-10" style={{ color: "#6B7280" }}>Real results from Toronto local businesses</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { industry: "🧹 Cleaning", name: "Sunshine Cleaning Co.", stat: "+42 reviews in 3 months" },
              { industry: "🌿 Landscaping", name: "GreenThumb Gardens", stat: "4.2★ → 4.8★ in 60 days" },
              { industry: "🍜 Restaurant", name: "Golden Dragon Toronto", stat: "2x more Google traffic" },
            ].map((c) => (
              <div
                key={c.name}
                className="bg-white rounded-2xl p-6 text-left"
                style={{ border: "1px solid #E8ECEF" }}
              >
                <div className="text-2xl mb-3">{c.industry.split(" ")[0]}</div>
                <div className="text-sm font-semibold mb-1" style={{ color: "#0D1B3E" }}>{c.name}</div>
                <div
                  className="text-xs font-medium px-2.5 py-1 rounded-full inline-block"
                  style={{ background: "rgba(0,201,167,0.1)", color: "#00C9A7" }}
                >
                  {c.stat}
                </div>
                <div
                  className="mt-4 pt-4 text-xs italic"
                  style={{ borderTop: "1px solid #F0F0F5", color: "#9CA3AF" }}
                >
                  Case study coming soon...
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dark CTA ── */}
      <section
        className="py-24"
        style={{ background: "linear-gradient(160deg, #0D1B3E 0%, #1a1a4e 100%)" }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <LogoIcon size={40} />
            <Wordmark light />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Ready to grow your<br />
            <span style={{
              background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Google reputation?</span>
          </h2>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Join local businesses in Toronto who are getting more 5-star reviews every week — automatically.
          </p>
          <Link
            href="/auth/register"
            className="inline-block text-sm font-semibold px-8 py-4 rounded-xl no-underline transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", color: "#fff" }}
          >
            {t("pricing.startTrial")} — Free for 14 days →
          </Link>
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            {t("pricing.noContract")} · {t("pricing.cancelAnytime")}
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10" style={{ borderTop: "1px solid #E8ECEF" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <LogoIcon size={24} />
              <Wordmark />
            </Link>
            <div className="flex items-center gap-6 text-sm" style={{ color: "#9CA3AF" }}>
              <Link href="/auth/login" className="no-underline hover:underline" style={{ color: "#9CA3AF" }}>
                {t("auth.signIn")}
              </Link>
              <Link href="/auth/register" className="no-underline hover:underline" style={{ color: "#9CA3AF" }}>
                {t("pricing.startTrial")}
              </Link>
              <a href="mailto:hello@thinkmake.ai" className="no-underline hover:underline" style={{ color: "#9CA3AF" }}>
                Contact
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 text-center text-xs" style={{ borderTop: "1px solid #F0F0F5", color: "#9CA3AF" }}>
            © 2026 StarLoop · <a href="https://thinkmake.ai" className="no-underline hover:underline" style={{ color: "#9CA3AF" }}>thinkmake.ai</a> · Built for local businesses in Toronto 🇨🇦
          </div>
        </div>
      </footer>
    </div>
  );
}
