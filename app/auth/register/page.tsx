"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const INDUSTRIES = [
  "HVAC", "Plumbing", "Electrical", "Cleaning", "Landscaping", "Roofing",
  "Auto Detailing", "Pest Control", "Pool Service", "Appliance Repair",
  "Handyman", "Painting", "Flooring", "General Contractor", "Other",
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

const STEPS = ["Account", "Business", "Customers", "Launch"];

const RIGHT_PANEL: Record<number, { title: string; body: React.ReactNode }> = {
  1: {
    title: "Join thousands of local service businesses running on autopilot.",
    body: (
      <div className="space-y-6">
        {[["$2,400", "avg. recovered / month"], ["34%", "customer return rate"], ["5 min", "setup time"]].map(([v, l]) => (
          <div key={l}>
            <p className="text-3xl font-extrabold text-white">{v}</p>
            <p className="text-[#64748b] text-sm mt-0.5">{l}</p>
          </div>
        ))}
      </div>
    ),
  },
  2: {
    title: "Your agents will be configured for your trade.",
    body: (
      <div className="space-y-3">
        {[["📞", "Intake Agent"], ["📋", "Follow-up Agent"], ["⭐", "Reputation Agent"], ["🔄", "Winback Agent"], ["👥", "Referral Agent"]].map(([icon, name]) => (
          <div key={name as string} className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <span className="text-white text-sm font-medium">{name}</span>
            <span className="ml-auto text-[#475569] text-xs">Active</span>
          </div>
        ))}
        <p className="text-[#475569] text-xs pt-2 leading-relaxed">
          Each agent understands the specific language and needs of your trade.
        </p>
      </div>
    ),
  },
  3: {
    title: "This is what your customers will receive.",
    body: (
      <div>
        <div className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#f97316]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#f97316] text-sm">S</span>
            </div>
            <div className="bg-[#334155] rounded-xl rounded-tl-none px-4 py-3">
              <p className="text-white text-sm leading-relaxed">
                Hi [Name] 👋 It&apos;s been a while since your last service with [Business Name]. Ready to book again? Reply YES or visit: servicestar.app/b/[slug]
              </p>
            </div>
          </div>
        </div>
        <p className="text-[#475569] text-xs leading-relaxed">
          Personalized. Automatic. Effective. Your Winback Agent sends this when customers go quiet.
        </p>
      </div>
    ),
  },
  4: {
    title: "Your business is now running on autopilot.",
    body: (
      <div className="space-y-3">
        {[
          ["📞", "Intake Agent", "Active"],
          ["📋", "Follow-up Agent", "Active"],
          ["⭐", "Reputation Agent", "Active"],
          ["🔄", "Winback Agent", "Active"],
          ["👥", "Referral Agent", "Active"],
        ].map(([icon, name, status]) => (
          <div key={name as string} className="flex items-center gap-3 py-1">
            <span className="text-xl">{icon}</span>
            <span className="text-white text-sm font-medium">{name}</span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">{status}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [biz, setBiz] = useState({ businessName: "", industry: "", city: "", phone: "" });
  const [customer, setCustomer] = useState({ name: "", phone: "", lastServiceDate: "", totalSpend: "" });
  const [analysis, setAnalysis] = useState<{ active: number; atRisk: number; lost: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  // Step 1 → 2: just validate locally, no API call yet
  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (account.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStep(2);
  }

  // Step 2 → 3: register account + business, then sign in
  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: account.name,
        email: account.email,
        password: account.password,
        businessName: biz.businessName,
        industry: biz.industry,
        phone: biz.phone,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }

    // Update business with city + slug
    const loginResult = await signIn("credentials", {
      email: account.email,
      password: account.password,
      redirect: false,
    });
    if (loginResult?.error) {
      setError("Account created but login failed — please sign in manually.");
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    // Update city + slug via profile API
    await fetch("/api/business/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: biz.city, slug: slugify(biz.businessName) }),
    }).catch(() => {});

    setLoading(false);
    setStep(3);
  }

  // Step 3 → 4: add customer (optional), then analyze
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/customers/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: customer.name,
        phone: customer.phone || null,
        lastServiceDate: customer.lastServiceDate || null,
        totalSpend: parseFloat(customer.totalSpend) || 0,
      }),
    });
    await triggerAnalysis();
    setLoading(false);
    setStep(4);
  }

  async function skipToLaunch() {
    await triggerAnalysis();
    setStep(4);
  }

  async function triggerAnalysis() {
    try {
      const r = await fetch("/api/customers/analyze", { method: "POST" });
      const d = await r.json();
      setAnalysis(d);
    } catch { /* ignore */ }
  }

  const panel = RIGHT_PANEL[step];

  return (
    <div className={`${dmSans.className} min-h-screen flex flex-col`}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#e2e8f0]">
        <div className="h-full bg-[#f97316] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Step dots */}
      <div className="fixed top-1 left-0 right-0 z-50 flex justify-center gap-8 pt-3 pb-2 bg-white border-b border-[#e2e8f0]">
        <Link href="/" className="absolute left-6 top-3 flex items-center gap-1.5 text-[#0f172a]">
          <div className="w-6 h-6 bg-[#0f172a] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">S</span>
          </div>
          <span className="text-sm font-semibold hidden sm:block">Service Star</span>
        </Link>
        {STEPS.map((label, i) => {
          const s = i + 1;
          const done = step > s;
          const active = step === s;
          return (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? "bg-green-500 text-white" : active ? "bg-[#f97316] text-white" : "bg-[#e2e8f0] text-[#94a3b8]"}`}>
                {done ? "✓" : s}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? "text-[#0f172a] font-semibold" : done ? "text-[#64748b]" : "text-[#94a3b8]"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="flex flex-1 pt-12">
        {/* Left — form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-20">
          <div className="w-full max-w-md">

            {/* Step 1 — Account */}
            {step === 1 && (
              <>
                <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2">Create your account</h1>
                <p className="text-[#64748b] mb-8">Get started free — no credit card needed.</p>
                {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>}
                <form onSubmit={handleStep1} className="space-y-4">
                  <F label="YOUR NAME" type="text" value={account.name} onChange={(v) => setAccount((a) => ({ ...a, name: v }))} required />
                  <F label="EMAIL" type="email" value={account.email} onChange={(v) => setAccount((a) => ({ ...a, email: v }))} required />
                  <F label="PASSWORD" type="password" value={account.password} onChange={(v) => setAccount((a) => ({ ...a, password: v }))} required placeholder="min 6 characters" />
                  <div className="pt-1">
                    <button type="submit" className="w-full bg-[#f97316] text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-colors">
                      Continue →
                    </button>
                  </div>
                  <p className="text-[#94a3b8] text-xs text-center">By signing up you agree to our Terms of Service</p>
                </form>
                <p className="text-center text-sm text-[#64748b] mt-6">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-[#0f172a] font-semibold hover:underline">Sign in</Link>
                </p>
              </>
            )}

            {/* Step 2 — Business */}
            {step === 2 && (
              <>
                <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2">Tell us about your business</h1>
                <p className="text-[#64748b] mb-8">We&apos;ll personalize your agents based on your trade.</p>
                {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>}
                <form onSubmit={handleStep2} className="space-y-4">
                  <F label="BUSINESS NAME" type="text" value={biz.businessName} onChange={(v) => setBiz((b) => ({ ...b, businessName: v }))} required />
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] tracking-wider mb-1.5">INDUSTRY</label>
                    <select value={biz.industry} onChange={(e) => setBiz((b) => ({ ...b, industry: e.target.value }))} required
                      className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 bg-white">
                      <option value="">Select your trade...</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <F label="CITY" type="text" value={biz.city} onChange={(v) => setBiz((b) => ({ ...b, city: v }))} placeholder="e.g. Toronto" />
                  <F label="PHONE NUMBER" type="tel" value={biz.phone} onChange={(v) => setBiz((b) => ({ ...b, phone: v }))} placeholder="+1 416 555 0100" />
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setStep(1)}
                      className="px-5 py-3.5 border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors">
                      ← Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 bg-[#f97316] text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-colors disabled:opacity-60">
                      {loading ? "Setting up..." : "Continue →"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3 — Customers */}
            {step === 3 && (
              <>
                <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2">Add your first customer</h1>
                <p className="text-[#64748b] mb-8">
                  We&apos;ll use this to show you how the Winback Agent works in real-time.
                </p>
                <form onSubmit={handleStep3} className="space-y-4">
                  <F label="CUSTOMER NAME" type="text" value={customer.name} onChange={(v) => setCustomer((c) => ({ ...c, name: v }))} required />
                  <F label="PHONE NUMBER" type="tel" value={customer.phone} onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))} required placeholder="+1 416 555 0100" />
                  <F label="LAST SERVICE DATE" type="date" value={customer.lastServiceDate} onChange={(v) => setCustomer((c) => ({ ...c, lastServiceDate: v }))} required />
                  <F label="AMOUNT SPENT ($)" type="number" value={customer.totalSpend} onChange={(v) => setCustomer((c) => ({ ...c, totalSpend: v }))} placeholder="Optional" />
                  <button type="submit" disabled={loading}
                    className="w-full bg-[#f97316] text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-colors disabled:opacity-60">
                    {loading ? "Saving..." : "Add Customer & Continue →"}
                  </button>
                </form>
                <button onClick={skipToLaunch} className="block w-full text-center text-sm text-[#94a3b8] mt-3 hover:text-[#64748b] transition-colors py-2">
                  Skip — I&apos;ll import a CSV later
                </button>
              </>
            )}

            {/* Step 4 — Launch */}
            {step === 4 && (
              <div>
                {/* Checkmark animation */}
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-[scale-in_0.3s_ease-out]">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2">You&apos;re all set.</h1>
                <p className="text-[#64748b] mb-8">Your 5 agents are now active and working automatically.</p>

                {analysis && (
                  <div className="border border-[#e2e8f0] rounded-xl p-5 mb-5">
                    <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">CUSTOMER SNAPSHOT</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-extrabold text-green-600">{analysis.active}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">Active</p>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-[#f97316]">{analysis.atRisk}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">At-Risk</p>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-red-500">{analysis.lost}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">Lost</p>
                      </div>
                    </div>
                  </div>
                )}

                {analysis && (analysis.atRisk + analysis.lost) > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                    <p className="text-[#f97316] text-sm font-semibold">
                      ⚡ We found {analysis.atRisk + analysis.lost} customers who haven&apos;t returned.
                    </p>
                    <p className="text-[#64748b] text-xs mt-1">Your Winback Agent is ready to bring them back.</p>
                  </div>
                )}

                <button onClick={() => router.push("/dashboard")}
                  className="w-full bg-[#f97316] text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-colors">
                  Go to Dashboard →
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Right — dark panel (lg+) */}
        <div className="hidden lg:flex w-[40%] bg-[#0f172a] flex-col justify-center px-12 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#1e293b]" />
          <div className="relative z-10">
            <p className="text-white text-2xl font-bold leading-snug mb-8">{panel.title}</p>
            {panel.body}
          </div>
        </div>
      </div>
    </div>
  );
}

function F({ label, type, value, onChange, required, placeholder }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#64748b] tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]/50 transition-all" />
    </div>
  );
}
