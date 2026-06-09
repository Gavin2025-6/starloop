import Link from "next/link";

const industries = ["HVAC","Plumbing","Electrical","Cleaning","Landscaping","Roofing","Auto Detailing","Pest Control"];

const steps = [
  { n: "1", title: "Import your customers", body: "Upload a CSV or add customers manually in seconds." },
  { n: "2", title: "AI finds who's missing", body: "We automatically classify every customer as active, at-risk, or lost." },
  { n: "3", title: "Revenue comes back", body: "Personalized AI messages go out. You collect bookings." },
];

const stats = [
  { value: "$2,400", label: "avg recovered / month" },
  { value: "34%", label: "customer return rate" },
  { value: "5 min", label: "setup time" },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    cta: "Get Started Free",
    features: ["Up to 50 customers", "3 campaigns / month", "Public profile page", "AI-personalized SMS"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/ month",
    cta: "Start Pro Trial",
    features: ["Unlimited customers", "Unlimited campaigns", "Advanced analytics", "Priority support"],
    highlight: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist)]">

      {/* Nav */}
      <nav className="bg-[#1a2744] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#f97316] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-white font-bold text-lg">Service Star</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-white/70 hover:text-white text-sm transition-colors">Sign in</Link>
          <Link href="/auth/register" className="bg-[#f97316] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#1a2744] px-6 pt-24 pb-28 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Your Best Customers Already Trust You.<br className="hidden md:block" />
            <span className="text-[#f97316]"> Bring Them Back Automatically.</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Service Star uses AI to identify and re-engage customers who haven&apos;t returned — without any effort from you.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-[#f97316] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-900/30"
          >
            Start Free · No Credit Card
          </Link>
          <p className="text-white/40 text-sm mt-4">Setup in 5 minutes · See results in 7 days</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#f97316] px-6 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-bold text-white">{s.value}</div>
              <div className="text-white/80 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1a2744] text-center mb-14">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 bg-[#1a2744] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-[#1a2744] text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="px-6 py-14 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">Built for home service businesses</p>
          <div className="flex flex-wrap justify-center gap-3">
            {industries.map((ind) => (
              <span key={ind} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1a2744] text-center mb-14">Simple Pricing</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-8 border-2 ${p.highlight ? "border-[#f97316] bg-[#fff8f5]" : "border-gray-200 bg-white"}`}
              >
                {p.highlight && (
                  <span className="inline-block bg-[#f97316] text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                    Most Popular
                  </span>
                )}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#1a2744]">{p.price}</span>
                  <span className="text-gray-400 ml-1">{p.period}</span>
                  <div className="text-gray-500 font-medium mt-1">{p.name}</div>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-[#f97316] font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    p.highlight
                      ? "bg-[#f97316] text-white hover:bg-orange-600"
                      : "bg-[#1a2744] text-white hover:bg-[#243460]"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#1a2744] px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to recover lost revenue?</h2>
        <p className="text-white/60 mb-8">Join hundreds of local businesses that automatically win back customers every week.</p>
        <Link
          href="/auth/register"
          className="inline-block bg-[#f97316] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-orange-600 transition-colors"
        >
          Start Free · No Credit Card
        </Link>
      </section>

      <footer className="bg-[#0f1929] px-6 py-8 text-center text-white/30 text-sm">
        © 2026 Service Star · AI-powered customer recovery for local businesses
      </footer>
    </div>
  );
}
