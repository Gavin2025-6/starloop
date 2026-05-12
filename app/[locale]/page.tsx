import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function LandingPage() {
  const t = useTranslations();

  return (
    <div
      className="min-h-screen"
      style={{ background: "#FFFFFF", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* ── Nav ── */}
      <nav
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid #E8ECEF" }}
      >
        <div className="flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="url(#navGrad)" strokeWidth="2" fill="none"/>
            <path d="M16 8 L17.5 13H22.5L18.5 16L20 21L16 18L12 21L13.5 16L9.5 13H14.5Z" fill="url(#navGrad)"/>
            <defs><linearGradient id="navGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#4B8EF5"/></linearGradient></defs>
          </svg>
          <span className="font-bold text-xl" style={{ color: "#1A1D23" }}>StarLoop</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/auth/login"
            className="text-sm font-medium no-underline"
            style={{ color: "#6B7280" }}
          >
            {t("auth.signIn")}
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-semibold px-4 py-2 text-white no-underline transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #6C63FF 0%, #4B8EF5 100%)",
              borderRadius: "10px",
            }}
          >
            {t("pricing.startTrial")}
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1A1D23 0%, #2D2B55 60%, #1A1D23 100%)" }}
      >
        {/* Subtle orbs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6C63FF, transparent)", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4B8EF5, transparent)", transform: "translate(-30%, 30%)" }}
        />

        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(108,99,255,0.2)", color: "#A89FFF" }}
              >
                <span>🇨🇦</span>
                <span>Built for Toronto small businesses</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                把好服务，变成好口碑
              </h1>
              <h2
                className="text-2xl lg:text-3xl font-bold mb-4 leading-tight"
                style={{
                  background: "linear-gradient(135deg, #6C63FF, #4B8EF5)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Turn Great Service Into 5-Star Reviews
              </h2>
              <p className="text-base mb-2" style={{ color: "#9CA3AF" }}>
                AI帮你管评价、拦差评、自动回复。每月$39起。
              </p>
              <p className="text-sm mb-8" style={{ color: "#6B7280" }}>
                $39/mo. AI-powered review management for local businesses.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/auth/register"
                  className="text-sm font-semibold px-6 py-3.5 rounded-xl no-underline transition-opacity hover:opacity-90"
                  style={{ background: "#fff", color: "#6C63FF" }}
                >
                  {t("pricing.startTrial")} →
                </Link>
                <a
                  href="#features"
                  className="text-sm font-medium px-6 py-3.5 rounded-xl no-underline transition-colors"
                  style={{ border: "1px solid rgba(108,99,255,0.4)", color: "#A89FFF" }}
                >
                  See how it works
                </a>
              </div>

              <p className="text-xs mt-4" style={{ color: "#6B7280" }}>
                {t("pricing.noContract")} · {t("pricing.cancelAnytime")}
              </p>
            </div>

            {/* Right: mock dashboard */}
            <div className="flex-1 lg:max-w-sm w-full">
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#FF4757" }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: "#00C9A7" }} />
                  <span className="text-xs ml-2" style={{ color: "#6B7280" }}>StarLoop Dashboard</span>
                </div>

                {/* Mock stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: "Total Reviews", value: "147", icon: "⭐" },
                    { label: "Avg Rating", value: "4.8★", icon: "📊" },
                    { label: "Requests Sent", value: "52", icon: "📱" },
                    { label: "Needs Reply", value: "3", icon: "💬" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="text-base mb-0.5">{s.icon}</div>
                      <div className="text-base font-bold text-white">{s.value}</div>
                      <div className="text-xs" style={{ color: "#6B7280" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Mock review */}
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #6C63FF, #4B8EF5)" }}>S</div>
                    <div>
                      <div className="text-xs font-medium text-white">Sarah K.</div>
                      <div className="text-xs" style={{ color: "#F59E0B" }}>★★★★★</div>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,201,167,0.2)", color: "#00C9A7" }}>Replied</span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Amazing service! They did an incredible job cleaning my house...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-10" style={{ background: "#F8F9FC" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Trusted by Toronto local businesses</p>
          <div className="flex justify-center gap-6 flex-wrap text-sm" style={{ color: "#9CA3AF" }}>
            {["🧹 Cleaning", "🌿 Landscaping", "🍜 Restaurant", "🔨 Renovation", "💅 Nail Salon"].map(
              (b) => <span key={b}>{b}</span>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#1A1D23" }}>
            Everything you need to grow your reputation
          </h2>
          <p style={{ color: "#6B7280" }}>Simple tools, powerful results</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🛡️",
              iconBg: "linear-gradient(135deg, rgba(0,201,167,0.15), rgba(75,142,245,0.15))",
              title: "Review Gate",
              titleZh: "差评永远不上Google",
              desc: "Bad reviews stay private",
            },
            {
              icon: "🤖",
              iconBg: "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(75,142,245,0.15))",
              title: "AI Replies",
              titleZh: "30秒生成专业回复",
              desc: "Professional replies in 30 seconds",
            },
            {
              icon: "📊",
              iconBg: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(255,71,87,0.08))",
              title: "Analytics",
              titleZh: "实时追踪评分趋势",
              desc: "Track your rating trend in real-time",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6"
              style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: f.iconBg }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-lg mb-0.5" style={{ color: "#1A1D23" }}>{f.titleZh}</h3>
              <p className="text-sm mb-3" style={{ color: "#6C63FF" }}>{f.title}</p>
              <p className="text-sm" style={{ color: "#6B7280" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20" style={{ background: "#F8F9FC" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#1A1D23" }}>
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
                features: ["10 SMS/month", "Review Gate", "Private feedback"],
                cta: "Get Started",
                href: "/auth/register",
                highlight: false,
                badge: null,
              },
              {
                name: "Starter",
                nameZh: "基础版",
                price: "$39",
                features: ["Unlimited SMS", "AI reply generation", "Google Business sync", "Email channel"],
                cta: t("pricing.startTrial"),
                href: "/auth/register",
                highlight: true,
                badge: "Most Popular",
              },
              {
                name: "Pro",
                nameZh: "专业版",
                price: "$79",
                features: ["Up to 5 locations", "Everything in Starter", "Analytics & reporting", "Priority support"],
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
                  background: plan.highlight ? "linear-gradient(135deg, #6C63FF 0%, #4B8EF5 100%)" : "#fff",
                  border: plan.highlight ? "none" : "1px solid #E8ECEF",
                  boxShadow: plan.highlight ? "0 8px 32px rgba(108,99,255,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap"
                    style={{ background: "#00C9A7", color: "#fff" }}
                  >
                    {plan.badge}
                  </div>
                )}
                <div className="text-base font-bold mb-0.5" style={{ color: plan.highlight ? "rgba(255,255,255,0.8)" : "#6B7280" }}>
                  {plan.nameZh}
                </div>
                <div className="text-lg font-semibold mb-1" style={{ color: plan.highlight ? "#fff" : "#1A1D23" }}>
                  {plan.name}
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: plan.highlight ? "#fff" : "#1A1D23" }}>
                  {plan.price}
                  <span className="text-base font-normal" style={{ opacity: 0.7 }}>
                    {t("pricing.perMonth")}
                  </span>
                </div>
                <ul className="my-5 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm flex items-center gap-2"
                      style={{ color: plan.highlight ? "rgba(255,255,255,0.85)" : "#6B7280" }}
                    >
                      <span style={{ color: plan.highlight ? "#fff" : "#00C9A7" }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="block text-center py-3 px-6 rounded-xl font-semibold text-sm no-underline transition-opacity hover:opacity-90"
                  style={
                    plan.highlight
                      ? { background: "#fff", color: "#6C63FF" }
                      : plan.href === "#"
                      ? { background: "#F0F0F5", color: "#9CA3AF", cursor: "not-allowed", pointerEvents: "none" }
                      : { background: "linear-gradient(135deg, #6C63FF, #4B8EF5)", color: "#fff" }
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center text-sm" style={{ borderTop: "1px solid #E8ECEF", color: "#9CA3AF" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="url(#footerGrad)" strokeWidth="2" fill="none"/>
            <path d="M16 8 L17.5 13H22.5L18.5 16L20 21L16 18L12 21L13.5 16L9.5 13H14.5Z" fill="url(#footerGrad)"/>
            <defs><linearGradient id="footerGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#4B8EF5"/></linearGradient></defs>
          </svg>
          <span className="font-semibold" style={{ color: "#6B7280" }}>StarLoop</span>
        </div>
        <p>© 2025 StarLoop · Built for local businesses in Toronto 🇨🇦</p>
      </footer>
    </div>
  );
}
