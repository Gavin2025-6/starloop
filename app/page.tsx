import Link from "next/link";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const agents = [
  { icon: "📞", name: "Every call answered", desc: "Answers every call, qualifies leads, and books appointments automatically. Never miss a customer again." },
  { icon: "📋", name: "Invoices sent automatically", desc: "Sends invoices and review requests the moment a job is complete. Gets you paid faster." },
  { icon: "⭐", name: "Reviews managed", desc: "Monitors every new review. Alerts you to bad ones instantly. Suggests replies for good ones." },
  { icon: "🔄", name: "Lost customers recovered", desc: "Identifies customers who've gone quiet and sends personalized messages to bring them back." },
];

const trades = [
  "HVAC", "Plumbing", "Electrical", "Cleaning", "Landscaping",
  "Roofing", "Auto Detailing", "Pest Control", "Garage Door",
  "Handyman", "Locksmith", "Pool & Spa", "Carpet Cleaning",
];

const withoutUs = [
  "Missed calls while you're on the job",
  "Manually chasing payments",
  "Hoping customers come back",
  "No time to respond to reviews",
  "Losing $2,400/month in repeat business",
];

const withUs = [
  "Every call answered automatically",
  "Invoices sent the moment you finish",
  "Lost customers brought back on autopilot",
  "Reviews monitored and replied to",
  "$2,400+ recovered every month",
];

export default function LandingPage() {
  return (
    <div className={`${dmSans.className} min-h-screen bg-white text-[#0f172a]`}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0f172a] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-[#0f172a] text-base">Service Star</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/auth/login" className="text-[#64748b] hover:text-[#0f172a] text-sm font-medium transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register"
              className="bg-[#f97316] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0f172a] pt-24 pb-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <p className="text-[#94a3b8] text-xs font-semibold uppercase tracking-[0.15em] mb-6">
                FOR HVAC · PLUMBING · ELECTRICAL · CLEANING · AND MORE
              </p>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] mb-6">
                Your business,<br />on autopilot.
              </h1>
              <p className="text-[#94a3b8] text-lg leading-relaxed max-w-[520px] mb-10">
                Service Star runs your entire customer journey automatically. Every call answered. Every invoice sent. Every lost customer recovered. You just do the work.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link href="/auth/register"
                  className="bg-[#f97316] text-white px-7 py-3.5 rounded-lg text-base font-semibold hover:bg-orange-600 transition-colors">
                  Get Started Free
                </Link>
                <p className="text-[#475569] text-sm pt-3">No credit card · 5-minute setup · Cancel anytime</p>
              </div>
            </div>
            {/* Right — mock dashboard card */}
            <div className="hidden lg:block">
              <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-2 mb-5">
                  {["Calls", "Invoices", "Winback"].map((a) => (
                    <span key={a} className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      {a}
                    </span>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-5">
                  <p className="text-[#94a3b8] text-xs uppercase tracking-wide mb-1">Recovered this month</p>
                  <p className="text-white text-4xl font-bold mb-1">$3,200</p>
                  <p className="text-green-400 text-sm font-medium">↑ 11 customers came back</p>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[{ l: "Active", v: "24", c: "text-green-400" }, { l: "At-Risk", v: "8", c: "text-[#f97316]" }, { l: "Lost", v: "3", c: "text-red-400" }].map((s) => (
                    <div key={s.l} className="bg-[#0f172a]/60 rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                      <p className="text-[#64748b] text-xs mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-[#e2e8f0] px-6 py-14">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "$2,400", label: "avg. recovered / month" },
            { value: "34%", label: "customer return rate" },
            { value: "5 min", label: "to get started" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-[#0f172a]">{s.value}</p>
              <p className="text-[#64748b] text-sm mt-1.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Systems */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-[#0f172a] mb-4">
              One system. All systems. Zero effort.
            </h2>
            <p className="text-[#64748b] text-lg max-w-xl mx-auto">
              Each agent handles a different part of your business — automatically, 24/7.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((a) => (
              <div key={a.name} className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:border-[#cbd5e1] hover:shadow-sm transition-all">
                <div className="text-3xl mb-4">{a.icon}</div>
                <h3 className="font-bold text-[#0f172a] text-base mb-2">{a.name}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
            {/* 6th card — CTA */}
            <div className="bg-[#0f172a] border border-transparent rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm mb-3">All systems, working together.</p>
                <p className="text-white font-bold text-base">Your business runs itself while you focus on the work.</p>
              </div>
              <Link href="/auth/register"
                className="mt-6 block text-center bg-[#f97316] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
                Start Free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-extrabold text-[#0f172a] text-center mb-14">
            Built for businesses like yours.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Without */}
            <div className="border border-[#e2e8f0] rounded-xl p-7">
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-widest mb-5">Without Service Star</p>
              <ul className="space-y-4">
                {withoutUs.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#64748b]">
                    <span className="text-[#cbd5e1] mt-0.5 flex-shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* With */}
            <div className="bg-[#0f172a] rounded-xl p-7">
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-widest mb-5">With Service Star</p>
              <ul className="space-y-4">
                {withUs.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white">
                    <span className="text-[#f97316] mt-0.5 flex-shrink-0 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trades */}
      <section className="bg-[#f8fafc] px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-[0.15em] mb-8">
            Works for every home service trade
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {trades.map((t) => (
              <span key={t} className="bg-white border border-[#e2e8f0] text-[#475569] text-sm font-medium px-4 py-2 rounded-full">
                {t}
              </span>
            ))}
            <span className="text-[#94a3b8] text-sm font-medium px-4 py-2">and more →</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-[#0f172a] text-center mb-4">
            Simple pricing. No surprises.
          </h2>
          <p className="text-[#64748b] text-center mb-14">Start free. Upgrade when you're ready.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="border-2 border-[#e2e8f0] rounded-2xl p-8">
              <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-4">Free</p>
              <div className="mb-2">
                <span className="text-5xl font-extrabold text-[#0f172a]">$0</span>
              </div>
              <p className="text-[#64748b] text-sm mb-7">Get started, no commitment.</p>
              <ul className="space-y-3 mb-8">
                {["Up to 50 customers", "3 campaigns / month", "Public booking page", "AI-personalized SMS", "Lost customers recovered"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#475569]">
                    <span className="text-[#94a3b8]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register"
                className="block text-center border-2 border-[#0f172a] text-[#0f172a] py-3 rounded-xl font-semibold text-sm hover:bg-[#f8fafc] transition-colors">
                Start Free
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-[#0f172a] rounded-2xl p-8 relative overflow-hidden">
              <span className="absolute top-5 right-5 bg-[#f97316] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                MOST POPULAR
              </span>
              <p className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-4">Pro</p>
              <div className="mb-1">
                <span className="text-5xl font-extrabold text-white">$49</span>
                <span className="text-[#64748b] ml-1">/month</span>
              </div>
              <p className="text-[#64748b] text-sm mb-7">For businesses serious about growth.</p>
              <ul className="space-y-3 mb-8">
                {["Unlimited customers", "Unlimited campaigns", "All systems active", "Advanced analytics", "Priority SMS delivery", "24/7 monitoring"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                    <span className="text-[#f97316]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register"
                className="block text-center bg-[#f97316] text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors">
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#0f172a] px-6 py-24 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-3">
          Stop running your business manually.
        </h2>
        <p className="text-[#64748b] text-lg mb-10">Service Star does it for you.</p>
        <Link href="/auth/register"
          className="inline-block bg-[#f97316] text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-orange-600 transition-colors">
          Get Started Free — No Credit Card
        </Link>
      </section>

      <footer className="bg-[#0f172a] border-t border-white/5 px-6 py-6 text-center">
        <p className="text-[#334155] text-sm">
          © 2026 Service Star · AI-powered revenue system for local service businesses
        </p>
      </footer>
    </div>
  );
}
