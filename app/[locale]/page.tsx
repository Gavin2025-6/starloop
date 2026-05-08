import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function LandingPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          <span className="font-bold text-xl text-gray-900">StarLoop</span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("auth.signIn")}
          </Link>
          <Link
            href="/auth/register"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("pricing.startTrial")}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full mb-6">
          <span>🇨🇦</span>
          <span>Built for Toronto small businesses</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          More Google Reviews.
          <br />
          <span className="text-blue-600">Less Work.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          StarLoop automatically collects Google reviews from your customers and
          generates AI-powered reply drafts — in English and Chinese.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {t("pricing.startTrial")} →
          </Link>
          <p className="text-sm text-gray-400 self-center">
            {t("pricing.noContract")} · {t("pricing.cancelAnytime")}
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm mb-6">
            Trusted by Toronto local businesses
          </p>
          <div className="flex justify-center gap-8 flex-wrap text-sm text-gray-400">
            {["🧹 Cleaning", "🌿 Landscaping", "🍜 Restaurant", "🔨 Renovation", "💅 Nail Salon"].map(
              (b) => (
                <span key={b}>{b}</span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to grow your reputation
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "📱",
              title: "SMS Review Requests",
              desc: "Send personalized text messages to your customers after each job, with automatic follow-ups.",
            },
            {
              icon: "🤖",
              title: "AI Reply Drafts",
              desc: "Claude AI generates thoughtful, personalized reply drafts for every review — positive or negative.",
            },
            {
              icon: "🌏",
              title: "English & Chinese",
              desc: "Full bilingual support. Interface and AI replies work in both English and 中文.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Way less than Birdeye ($299/mo) or Podium ($399/mo)
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$39",
                features: [
                  "1 business location",
                  "Unlimited SMS requests",
                  "AI reply generation",
                  "Google Business sync",
                  "English + Chinese",
                ],
                cta: t("pricing.startTrial"),
                highlight: true,
              },
              {
                name: "Pro",
                price: "$79",
                features: [
                  "Up to 5 locations",
                  "Everything in Starter",
                  "Priority AI replies",
                  "Advanced analytics",
                  "Email support",
                ],
                cta: "Coming soon",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 ${
                  plan.highlight
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="text-lg font-bold mb-1">{plan.name}</div>
                <div className="text-3xl font-bold mb-1">
                  {plan.price}
                  <span className="text-base font-normal opacity-70">
                    {t("pricing.perMonth")}
                  </span>
                </div>
                <ul className="my-6 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`text-sm flex items-center gap-2 ${
                        plan.highlight ? "text-blue-100" : "text-gray-600"
                      }`}
                    >
                      <span>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.highlight ? "/auth/register" : "#"}
                  className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100">
        <p>© 2024 StarLoop · Made in Toronto, Canada 🇨🇦</p>
      </footer>
    </div>
  );
}
