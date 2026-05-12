import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

// Inline LogoMark component (fallback until Logo component is available)
function LogoMark({ variant = "light", height = 32 }: { variant?: "dark" | "light"; height?: number }) {
  const iconSize = Math.round(height * 1.1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(height * 0.3) }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lm-star" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C9A7"/><stop offset="100%" stopColor="#4A6FFF"/>
          </linearGradient>
          <linearGradient id="lm-orbit" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.85"/><stop offset="100%" stopColor="#4A6FFF" stopOpacity="0.85"/>
          </linearGradient>
          <marker id="lm-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#4A6FFF" opacity="0.85"/>
          </marker>
        </defs>
        <ellipse cx="22" cy="22" rx="18" ry="9" stroke="url(#lm-orbit)" strokeWidth="2" fill="none"
          strokeDasharray="56 56" strokeDashoffset="28" transform="rotate(-25 22 22)" markerEnd="url(#lm-arrow)"/>
        <path d="M22 4 L24.1 15H35.1L26.4 21.5L29.5 32.5L22 26.1L14.5 32.5L17.6 21.5L8.9 15H19.9Z"
          stroke="url(#lm-star)" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
        <path d="M38 2 L39 5 L42 6 L39 7 L38 10 L37 7 L34 6 L37 5Z" fill="#00C9A7"/>
      </svg>
      <span style={{ fontWeight: 700, fontSize: Math.round(height * 0.7), lineHeight: 1 }}>
        <span style={{ color: variant === "dark" ? "#FFFFFF" : "#0D1117" }}>star</span>
        <span style={{ color: "#00C9A7" }}>loop</span>
      </span>
    </div>
  );
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations();

  return (
    <div
      style={{
        background: "#0A0A0A",
        minHeight: "100vh",
        fontFamily: "var(--font-geist), -apple-system, sans-serif",
        color: "#FFFFFF",
      }}
    >
      {/* ─── Navbar ─── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #1F1F1F",
          height: "64px",
        }}
      >
        <div
          className="max-w-6xl mx-auto px-6 flex justify-between items-center"
          style={{ height: "64px" }}
        >
          <LogoMark variant="dark" height={28} />
          <div className="flex items-center gap-4">
            <div style={{ color: "#A1A1AA" }}>
              <LanguageSwitcher />
            </div>
            <Link
              href="/auth/login"
              className="text-sm px-4 hover:text-white transition-colors"
              style={{ color: "#A1A1AA" }}
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#F0F0F0] transition-colors"
              style={{ background: "#FFFFFF", color: "#000000" }}
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section
        className="flex items-center"
        style={{ minHeight: "100vh", paddingTop: "64px" }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center w-full">
          {/* Small tag */}
          <div className="mb-8 flex justify-center">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm"
              style={{
                border: "1px solid #1F1F1F",
                color: "#A1A1AA",
              }}
            >
              ✦ AI-powered review management for local businesses
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-6 font-extrabold text-white"
            style={{
              fontSize: "clamp(3rem, 8vw, 5.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Get more 5-star
            <br />
            reviews. Automatically.
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl max-w-2xl mx-auto mb-10"
            style={{ color: "#A1A1AA", lineHeight: 1.6 }}
          >
            Block negative reviews before they reach Google. AI replies for
            every customer. Built for Toronto&apos;s local businesses.
          </p>

          {/* Button group */}
          <div className="flex gap-4 justify-center mb-6 flex-wrap">
            <Link
              href="/auth/register"
              className="px-8 py-4 rounded-lg text-base font-semibold hover:bg-[#F0F0F0] transition-all duration-200"
              style={{ background: "#FFFFFF", color: "#0A0A0A" }}
            >
              Start free trial →
            </Link>
            <a
              href="#features"
              className="px-8 py-4 rounded-lg text-base hover:border-[#4F4F4F] hover:text-white transition-all"
              style={{
                border: "1px solid #2F2F2F",
                color: "#A1A1AA",
              }}
            >
              See how it works
            </a>
          </div>

          {/* Fine print */}
          <p className="text-sm" style={{ color: "#4F4F4F" }}>
            No credit card required · No contracts · Cancel anytime
          </p>
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div className="mt-32" style={{ borderTop: "1px solid #1F1F1F" }} />

      {/* ─── Metrics Strip ─── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white">8–10x</div>
              <div className="text-sm mt-1" style={{ color: "#4F4F4F" }}>
                cheaper than competitors
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">$39</div>
              <div className="text-sm mt-1" style={{ color: "#4F4F4F" }}>
                per month, all features included
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">2 min</div>
              <div className="text-sm mt-1" style={{ color: "#4F4F4F" }}>
                setup time, no CRM needed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-32">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <p
            className="text-sm font-medium uppercase tracking-widest mb-4"
            style={{ color: "#00C9A7" }}
          >
            FEATURES
          </p>
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything you need.
          </h2>
          <p className="mb-16" style={{ color: "#A1A1AA" }}>
            Built for Toronto businesses. Priced for real people.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div
              className="rounded-2xl p-8 hover:border-[#2F2F2F] transition-all duration-200"
              style={{
                background: "#111111",
                border: "1px solid #1F1F1F",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-6"
                style={{ border: "1px solid #2F2F2F" }}
              >
                <span className="text-lg" style={{ color: "#00C9A7" }}>
                  🛡️
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Review Gate™
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                1-3 star customers are redirected privately. Only happy
                customers reach Google.
              </p>
              <p
                className="mt-6 text-xs font-medium uppercase tracking-wide"
                style={{ color: "#00C9A7" }}
              >
                Exclusive feature
              </p>
            </div>

            {/* Card 2 */}
            <div
              className="rounded-2xl p-8 hover:border-[#2F2F2F] transition-all duration-200"
              style={{
                background: "#111111",
                border: "1px solid #1F1F1F",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-6"
                style={{ border: "1px solid #2F2F2F" }}
              >
                <span className="text-lg" style={{ color: "#00C9A7" }}>
                  ✦
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Claude AI Replies
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                Personalized replies that sound human. Competitors use GPT and
                sound robotic.
              </p>
              <p
                className="mt-6 text-xs font-medium uppercase tracking-wide"
                style={{ color: "#00C9A7" }}
              >
                Powered by Claude
              </p>
            </div>

            {/* Card 3 */}
            <div
              className="rounded-2xl p-8 hover:border-[#2F2F2F] transition-all duration-200"
              style={{
                background: "#111111",
                border: "1px solid #1F1F1F",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-6"
                style={{ border: "1px solid #2F2F2F" }}
              >
                <span className="text-lg" style={{ color: "#00C9A7" }}>
                  🌐
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Built for Chinese Businesses
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                The only review tool with Chinese UI. Auto-detects language.
                EN/中文 support.
              </p>
              <p
                className="mt-6 text-xs font-medium uppercase tracking-wide"
                style={{ color: "#00C9A7" }}
              >
                Toronto exclusive
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Deep-dive: Review Gate ─── */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
            {/* Left — text */}
            <div>
              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: "#00C9A7" }}
              >
                Review Gate™
              </p>
              <h2 className="text-3xl font-bold text-white mb-4">
                Stop bad reviews before they go public.
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: "#6B7280" }}>
                When a customer rates 1-3 stars, they&apos;re redirected to a
                private message. You get their contact info. Google never sees
                it.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  "Collect customer phone & email automatically",
                  "AI suggests how to recover the relationship",
                  "Turn unhappy customers into advocates",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span
                      className="rounded-full mt-2 flex-shrink-0"
                      style={{
                        width: "6px",
                        height: "6px",
                        background: "#00C9A7",
                        display: "inline-block",
                      }}
                    />
                    <span className="text-sm" style={{ color: "#A1A1AA" }}>
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — mockup */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "#111111",
                border: "1px solid #1F1F1F",
              }}
            >
              <p className="text-sm font-medium text-white mb-4">
                How was your experience?
              </p>
              {/* Star rating */}
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={star <= 4 ? "#00C9A7" : "none"}
                    stroke="#00C9A7"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
                      strokeLinejoin="round"
                    />
                  </svg>
                ))}
              </div>
              {/* Private form preview */}
              <div
                className="rounded-lg p-4"
                style={{ background: "#0A0A0A" }}
              >
                <p className="text-xs mb-2" style={{ color: "#6B7280" }}>
                  Please tell us what went wrong
                </p>
                <div
                  className="rounded-lg p-3 text-xs"
                  style={{
                    border: "1px solid #1F1F1F",
                    color: "#4F4F4F",
                    height: "64px",
                  }}
                >
                  We&apos;d love to resolve this privately...
                </div>
                <div
                  className="mt-3 text-xs px-4 py-2 rounded-lg w-full text-center"
                  style={{
                    background: "#111111",
                    border: "1px solid #2F2F2F",
                    color: "#A1A1AA",
                  }}
                >
                  Submit privately
                </div>
              </div>
            </div>
          </div>

          {/* ─── Deep-dive: AI Replies ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — mockup */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "#111111",
                border: "1px solid #1F1F1F",
              }}
            >
              <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
                REVIEW
              </p>
              <div
                className="rounded-lg p-4 mb-4 text-sm"
                style={{ background: "#0A0A0A", color: "#A1A1AA" }}
              >
                <span style={{ color: "#F59E0B" }}>★★★★★</span>
                <p className="mt-1">
                  Amazing service! Very professional and thorough. Highly
                  recommend to anyone in Toronto!
                </p>
              </div>
              <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
                AI REPLY (Claude)
              </p>
              <div
                className="rounded-lg p-4 text-sm text-white"
                style={{
                  background: "#0A1628",
                  border: "1px solid rgba(0,201,167,0.2)",
                }}
              >
                Thank you so much for the kind words! We truly appreciate your
                trust and look forward to serving you again. ⭐
              </div>
              {/* Tone pills */}
              <div className="flex gap-2 mt-4">
                <span
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{ background: "#FFFFFF", color: "#000000" }}
                >
                  Professional
                </span>
                <span
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{ border: "1px solid #2F2F2F", color: "#6B7280" }}
                >
                  Warm
                </span>
                <span
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{ border: "1px solid #2F2F2F", color: "#6B7280" }}
                >
                  Casual
                </span>
              </div>
            </div>

            {/* Right — text */}
            <div>
              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: "#00C9A7" }}
              >
                Claude AI
              </p>
              <h2 className="text-3xl font-bold text-white mb-4">
                CEO-quality replies in seconds.
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: "#6B7280" }}>
                Claude AI analyzes each review and writes a professional,
                on-brand reply. Sounds like you wrote it yourself.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  "Matches your tone: formal or friendly",
                  "Bilingual — English and Chinese responses",
                  "Edit before publishing, or publish instantly",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span
                      className="rounded-full mt-2 flex-shrink-0"
                      style={{
                        width: "6px",
                        height: "6px",
                        background: "#00C9A7",
                        display: "inline-block",
                      }}
                    />
                    <span className="text-sm" style={{ color: "#A1A1AA" }}>
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section
        id="pricing"
        className="py-32"
        style={{
          background: "#050505",
          borderTop: "1px solid #1F1F1F",
          borderBottom: "1px solid #1F1F1F",
        }}
      >
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Simple pricing.
            </h2>
            <p style={{ color: "#6B7280" }}>
              8-10x cheaper than Birdeye or Podium. No contracts.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div
              className="rounded-2xl p-8"
              style={{
                background: "#111111",
                border: "1px solid #1F1F1F",
              }}
            >
              <p className="text-sm mb-2" style={{ color: "#6B7280" }}>
                Free
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-bold"
                  style={{ fontSize: "3rem", color: "#FFFFFF" }}
                >
                  $0
                </span>
                <span style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                  /month
                </span>
              </div>
              <div
                className="my-6"
                style={{ borderTop: "1px solid #1F1F1F" }}
              />
              <div className="flex flex-col gap-3">
                {["10 SMS/month", "Review Gate™", "Private feedback"].map(
                  (feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#00C9A7" }}
                      >
                        ✓
                      </span>
                      <span className="text-sm" style={{ color: "#A1A1AA" }}>
                        {feature}
                      </span>
                    </div>
                  )
                )}
              </div>
              <Link
                href="/auth/register"
                className="block mt-8 py-3 rounded-lg text-sm text-center hover:border-[#4F4F4F] hover:text-white transition-all"
                style={{
                  border: "1px solid #2F2F2F",
                  color: "#A1A1AA",
                }}
              >
                Get started
              </Link>
            </div>

            {/* Starter — highlight */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "#FFFFFF", position: "relative" }}
            >
              <div
                className="absolute text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#00C9A7",
                  color: "#000000",
                  whiteSpace: "nowrap",
                }}
              >
                Most popular
              </div>
              <p className="text-sm mb-2" style={{ color: "#6B7280" }}>
                Starter
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-bold"
                  style={{ fontSize: "3rem", color: "#0D1117" }}
                >
                  $39
                </span>
                <span style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                  /month
                </span>
              </div>
              <div
                className="my-6"
                style={{ borderTop: "1px solid #E5E7EB" }}
              />
              <div className="flex flex-col gap-3">
                {[
                  "Unlimited SMS & Email",
                  "Claude AI replies",
                  "Google Business sync",
                  "Monthly AI report",
                  "Review Gate™",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#00C9A7" }}
                    >
                      ✓
                    </span>
                    <span className="text-sm" style={{ color: "#374151" }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/auth/register"
                className="block mt-8 py-3 rounded-lg text-sm text-center font-medium hover:bg-[#1a1a1a] transition-all"
                style={{ background: "#0D1117", color: "#FFFFFF" }}
              >
                Start free trial →
              </Link>
            </div>

            {/* Pro */}
            <div
              className="rounded-2xl p-8"
              style={{
                background: "#111111",
                border: "1px solid #1F1F1F",
              }}
            >
              <p className="text-sm mb-2" style={{ color: "#6B7280" }}>
                Pro
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-bold"
                  style={{ fontSize: "3rem", color: "#FFFFFF" }}
                >
                  $79
                </span>
                <span style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                  /month
                </span>
              </div>
              <div
                className="my-6"
                style={{ borderTop: "1px solid #1F1F1F" }}
              />
              <div className="flex flex-col gap-3">
                {[
                  "Everything in Starter",
                  "Up to 3 locations",
                  "CSV import",
                  "Priority support",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#00C9A7" }}
                    >
                      ✓
                    </span>
                    <span className="text-sm" style={{ color: "#A1A1AA" }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/auth/register"
                className="block mt-8 py-3 rounded-lg text-sm text-center hover:bg-[#1F1F1F] transition-all"
                style={{
                  border: "1px solid #2F2F2F",
                  color: "#FFFFFF",
                }}
              >
                Get Pro
              </Link>
            </div>
          </div>

          {/* Comparison table */}
          <div className="mt-20">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#111111",
                border: "1px solid #1F1F1F",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#0A0A0A" }}>
                      {["Feature", "StarLoop", "Birdeye", "Podium"].map(
                        (col) => (
                          <th
                            key={col}
                            className="px-6 py-4 text-left text-xs uppercase tracking-wide"
                            style={{ color: "#6B7280" }}
                          >
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["价格", "$39/mo", "$299/mo", "$399/mo"],
                      ["合同", "无合同", "12个月", "年付"],
                      ["中文界面", "✅", "❌", "❌"],
                      ["差评拦截", "✅", "❌", "❌"],
                      ["AI引擎", "Claude", "GPT", "GPT"],
                    ].map((row, i) => (
                      <tr
                        key={i}
                        style={{ borderTop: "1px solid #1F1F1F" }}
                      >
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ color: "#6B7280" }}
                        >
                          {row[0]}
                        </td>
                        <td
                          className="px-6 py-4 text-sm font-medium"
                          style={{ color: "#00C9A7" }}
                        >
                          {row[1]}
                        </td>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ color: "#A1A1AA" }}
                        >
                          {row[2]}
                        </td>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ color: "#A1A1AA" }}
                        >
                          {row[3]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-32 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-white mb-4">
            Start growing your reputation today.
          </h2>
          <p className="mb-10" style={{ color: "#6B7280" }}>
            Join local businesses in Toronto getting more 5-star reviews every
            week.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-10 py-4 rounded-lg font-semibold text-base hover:bg-[#F0F0F0] transition-all"
            style={{ background: "#FFFFFF", color: "#000000" }}
          >
            Start free trial →
          </Link>
          <p className="text-sm mt-4" style={{ color: "#4F4F4F" }}>
            No credit card · No contracts · Cancel anytime
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: "1px solid #1F1F1F" }} className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Col 1 — Brand */}
            <div>
              <LogoMark variant="dark" height={24} />
              <p className="text-sm mt-2" style={{ color: "#4F4F4F" }}>
                Reviews · Reputation · Growth
              </p>
            </div>

            {/* Col 2 — Product */}
            <div>
              <p
                className="text-xs uppercase tracking-wide mb-3"
                style={{ color: "#6B7280" }}
              >
                Product
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Reviews", href: "#" },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="text-sm hover:text-white transition-colors"
                    style={{ color: "#4F4F4F" }}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Col 3 — Company */}
            <div>
              <p
                className="text-xs uppercase tracking-wide mb-3"
                style={{ color: "#6B7280" }}
              >
                Company
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-sm hover:text-white transition-colors"
                  style={{ color: "#4F4F4F" }}
                >
                  About
                </a>
                <a
                  href="mailto:hello@thinkmake.ai"
                  className="text-sm hover:text-white transition-colors"
                  style={{ color: "#4F4F4F" }}
                >
                  Contact
                </a>
              </div>
            </div>

            {/* Col 4 — Legal */}
            <div>
              <p
                className="text-xs uppercase tracking-wide mb-3"
                style={{ color: "#6B7280" }}
              >
                Legal
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-sm hover:text-white transition-colors"
                  style={{ color: "#4F4F4F" }}
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-sm hover:text-white transition-colors"
                  style={{ color: "#4F4F4F" }}
                >
                  Terms
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4"
            style={{ borderTop: "1px solid #1F1F1F" }}
          >
            <p className="text-xs" style={{ color: "#4F4F4F" }}>
              © 2026 StarLoop · thinkmake.ai
            </p>
            <div className="flex gap-4 text-xs" style={{ color: "#4F4F4F" }}>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
