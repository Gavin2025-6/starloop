"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DM_Sans } from "next/font/google";
import { Check } from "lucide-react";
import type { ServiceCatalogItem } from "@/lib/verticals";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

const STEPS = ["Account", "Business", "Trade", "Preview", "Launch"];

type Trade = "HVAC" | "PLUMBING" | "ELECTRICAL" | "CLEANING" | "ROOFING" | "HANDYMAN";
const TRADE_CARDS: { trade: Trade; label: string; icon: string }[] = [
  { trade: "HVAC",       label: "HVAC",        icon: "🌡️" },
  { trade: "PLUMBING",   label: "Plumbing",    icon: "🔧" },
  { trade: "ELECTRICAL", label: "Electrical",  icon: "⚡" },
  { trade: "CLEANING",   label: "Cleaning",    icon: "🧹" },
  { trade: "ROOFING",    label: "Roofing",     icon: "🏠" },
  { trade: "HANDYMAN",   label: "Handyman",    icon: "🔨" },
];

const RESULT_LINES: [string, string][] = [
  ["📞", "Calls answered automatically"],
  ["📋", "Invoices & review requests sent for you"],
  ["🔄", "Quiet customers win themselves back"],
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [account,  setAccount]  = useState({ name: "", email: "", password: "" });
  const [biz,      setBiz]      = useState({ businessName: "", city: "", phone: "" });
  const [trade,    setTrade]    = useState<Trade | null>(null);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // AI generation results
  const [aiGreeting, setAiGreeting] = useState("");
  const [catalog,    setCatalog]    = useState<ServiceCatalogItem[]>([]);

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  // Step 1 → 2
  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (account.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStep(2);
  }

  // Step 2 → 3: register + sign in
  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: account.name, email: account.email, password: account.password, businessName: biz.businessName, industry: "Other", phone: biz.phone }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }

    const login = await signIn("credentials", { email: account.email, password: account.password, redirect: false });
    if (login?.error) { setError("Account created — please sign in."); router.push("/auth/login"); return; }

    await fetch("/api/business/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: biz.city, slug: slugify(biz.businessName) }),
    }).catch(() => {});

    setLoading(false);
    setStep(3);
  }

  // Step 3 → 4: select trade, call generate
  async function handleStep3(selectedTrade: Trade) {
    setTrade(selectedTrade);
    setLoading(true);
    setStep(4); // show loading state immediately

    const res = await fetch("/api/onboarding/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trade: selectedTrade }),
    }).catch(() => null);

    if (res?.ok) {
      const data = await res.json();
      setAiGreeting(data.aiGreetingScript ?? "");
      setCatalog(data.preset?.serviceCatalog ?? []);
    }
    setLoading(false);
  }

  // Step 4 → 5: confirm price book, seed it
  async function handleStep4(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/pricebook/seed", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: catalog }),
    }).catch(() => {});
    setLoading(false);
    setStep(5);
  }

  function updateCatalogItem(idx: number, field: keyof ServiceCatalogItem, value: string | number) {
    setCatalog((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function removeCatalogItem(idx: number) {
    setCatalog((prev) => prev.filter((_, i) => i !== idx));
  }

  const twilioNumber = process.env.NEXT_PUBLIC_TWILIO_NUMBER ?? "your Twilio number";

  return (
    <div className={`${dmSans.className} min-h-screen flex flex-col`}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#e2e8f0]">
        <div className="h-full bg-[#f97316] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Step dots */}
      <div className="fixed top-1 left-0 right-0 z-50 flex justify-center gap-6 pt-3 pb-2 bg-white border-b border-[#e2e8f0]">
        <Link href="/" className="absolute left-6 top-3 flex items-center gap-1.5 text-[#0f172a]">
          <div className="w-6 h-6 bg-[#0f172a] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">S</span>
          </div>
          <span className="text-sm font-semibold hidden sm:block">Service Star</span>
        </Link>
        {STEPS.map((label, i) => {
          const s = i + 1; const done = step > s; const active = step === s;
          return (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? "bg-green-500 text-white" : active ? "bg-[#f97316] text-white" : "bg-[#e2e8f0] text-[#94a3b8]"}`}>
                {done ? "✓" : s}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? "text-[#0f172a] font-semibold" : done ? "text-[#64748b]" : "text-[#94a3b8]"}`}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 pt-12">
        {/* Left */}
        <div className="flex-1 flex items-start justify-center px-6 py-12 lg:py-16 overflow-y-auto">
          <div className="w-full max-w-lg">

            {/* Step 1 — Account */}
            {step === 1 && (
              <>
                <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2">Create your account</h1>
                <p className="text-[#64748b] mb-8">Get started free — no credit card needed.</p>
                {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>}
                <form onSubmit={handleStep1} className="space-y-4">
                  <F label="YOUR NAME"  type="text"     value={account.name}     onChange={(v) => setAccount((a) => ({ ...a, name: v }))}     required />
                  <F label="EMAIL"      type="email"    value={account.email}    onChange={(v) => setAccount((a) => ({ ...a, email: v }))}    required />
                  <F label="PASSWORD"   type="password" value={account.password} onChange={(v) => setAccount((a) => ({ ...a, password: v }))} required placeholder="min 6 characters" />
                  <button type="submit" className="w-full bg-[#f97316] text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-colors">Continue →</button>
                  <p className="text-[#94a3b8] text-xs text-center">By signing up you agree to our Terms of Service</p>
                </form>
                <p className="text-center text-sm text-[#64748b] mt-6">
                  Already have an account? <Link href="/auth/login" className="text-[#0f172a] font-semibold hover:underline">Sign in</Link>
                </p>
              </>
            )}

            {/* Step 2 — Business */}
            {step === 2 && (
              <>
                <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2">Your business details</h1>
                <p className="text-[#64748b] mb-8">We&apos;ll configure your front office in the next step.</p>
                {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>}
                <form onSubmit={handleStep2} className="space-y-4">
                  <F label="BUSINESS NAME" type="text" value={biz.businessName} onChange={(v) => setBiz((b) => ({ ...b, businessName: v }))} required />
                  <F label="CITY"          type="text" value={biz.city}         onChange={(v) => setBiz((b) => ({ ...b, city: v }))}         placeholder="e.g. Toronto" />
                  <F label="PHONE NUMBER"  type="tel"  value={biz.phone}        onChange={(v) => setBiz((b) => ({ ...b, phone: v }))}        placeholder="+1 416 555 0100" />
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setStep(1)} className="px-5 py-3.5 border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] hover:bg-[#f8fafc]">← Back</button>
                    <button type="submit" disabled={loading} className="flex-1 bg-[#f97316] text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 disabled:opacity-60">
                      {loading ? "Setting up..." : "Continue →"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3 — Trade selection */}
            {step === 3 && (
              <>
                <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2">What&apos;s your trade?</h1>
                <p className="text-[#64748b] mb-8">We&apos;ll build your service catalog, pricing, and call scripts automatically.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TRADE_CARDS.map(({ trade: t, label, icon }) => (
                    <button key={t} onClick={() => handleStep3(t)}
                      className="flex flex-col items-center gap-2 p-5 border-2 border-[#e2e8f0] rounded-xl hover:border-[#f97316] hover:bg-orange-50 transition-all text-[#0f172a] font-semibold text-sm">
                      <span className="text-3xl">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 4 — AI preview + Price Book confirmation */}
            {step === 4 && (
              <>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-full border-4 border-[#f97316] border-t-transparent animate-spin mb-6" />
                    <h2 className="text-xl font-bold text-[#0f172a] mb-2">Building your front office...</h2>
                    <p className="text-[#64748b] text-sm">Setting up your service catalog, pricing, and call scripts.</p>
                  </div>
                ) : (
                  <form onSubmit={handleStep4}>
                    <h1 className="text-2xl font-extrabold text-[#0f172a] mb-1">Your front office is ready</h1>
                    <p className="text-[#64748b] text-sm mb-6">Review and adjust your services and prices — you can always change these later.</p>

                    {aiGreeting && (
                      <div className="bg-[#0f172a] rounded-xl p-4 mb-6 border border-white/10">
                        <p className="text-[#94a3b8] text-xs uppercase tracking-wider mb-2">AI Phone Script</p>
                        <p className="text-white text-sm leading-relaxed">&ldquo;{aiGreeting}&rdquo;</p>
                      </div>
                    )}

                    <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Service Catalog & Pricing</p>
                    <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto pr-1">
                      {catalog.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 border border-gray-200 rounded-xl p-3 bg-white">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0f172a] truncate">{item.name}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-gray-400">$</span>
                            <input type="number" value={item.priceMin} min={0}
                              onChange={(e) => updateCatalogItem(idx, "priceMin", parseFloat(e.target.value) || 0)}
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none" />
                            <span className="text-xs text-gray-400">–</span>
                            <input type="number" value={item.priceMax} min={0}
                              onChange={(e) => updateCatalogItem(idx, "priceMax", parseFloat(e.target.value) || 0)}
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none" />
                            <button type="button" onClick={() => removeCatalogItem(idx)}
                              className="text-gray-300 hover:text-red-400 text-lg leading-none ml-1">×</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full bg-[#f97316] text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 disabled:opacity-60">
                      {loading ? "Saving..." : "Confirm & Launch →"}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Step 5 — Launch */}
            {step === 5 && (
              <div>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
                <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2">Your front office is live.</h1>
                <p className="text-[#64748b] mb-6">Forward your missed calls to your Twilio number and we&apos;ll handle the rest.</p>

                <div className="border border-[#e2e8f0] rounded-xl p-5 mb-5 space-y-3">
                  <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Call Forwarding Setup</p>
                  <div className="bg-[#f8fafc] rounded-lg p-3">
                    <p className="text-xs font-medium text-[#64748b] mb-1">iPhone</p>
                    <p className="text-sm font-mono text-[#0f172a]">Settings → Phone → Call Forwarding → Enter {twilioNumber}</p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-lg p-3">
                    <p className="text-xs font-medium text-[#64748b] mb-1">Universal (most carriers)</p>
                    <p className="text-sm font-mono text-[#0f172a]">Dial <strong>*61*{twilioNumber}#</strong> from your business phone</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {RESULT_LINES.map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <span className="text-[#0f172a] text-sm font-medium">{text}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => router.push("/dashboard")}
                  className="w-full bg-[#f97316] text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-colors">
                  Go to Dashboard →
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Right panel */}
        <div className="hidden lg:flex w-[40%] bg-[#0f172a] flex-col justify-center px-12 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#1e293b]" />
          <div className="relative z-10">
            {step <= 2 && (
              <>
                <p className="text-white text-2xl font-bold leading-snug mb-8">Every call answered. Every invoice sent. Every lost customer recovered.</p>
                <div className="space-y-4">
                  {RESULT_LINES.map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <span className="text-white text-sm font-medium">{text}</span>
                    </div>
                  ))}
                  <p className="text-[#475569] text-sm pt-2">You just do the work. <span className="text-[#00C9A7] font-semibold">5 min setup.</span></p>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <p className="text-white text-2xl font-bold leading-snug mb-8">No forms. We build it for you.</p>
                <div className="space-y-3">
                  {[["📋", "Service catalog pre-filled"], ["💰", "Real price ranges for your trade"], ["📞", "AI call script ready to go"]].map(([i, t]) => (
                    <div key={t as string} className="flex items-center gap-3">
                      <span className="text-xl">{i}</span>
                      <span className="text-white text-sm font-medium">{t}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <p className="text-white text-2xl font-bold leading-snug mb-6">Built for {TRADE_CARDS.find((t) => t.trade === trade)?.label ?? "your trade"}.</p>
                <p className="text-[#64748b] text-sm leading-relaxed">Prices are based on current North American market rates. Adjust to match your market.</p>
              </>
            )}
            {step === 5 && (
              <>
                <p className="text-white text-2xl font-bold leading-snug mb-8">Your front office is live.</p>
                <div className="space-y-4">
                  {RESULT_LINES.map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-3 py-1">
                      <span className="text-xl">{icon}</span>
                      <span className="text-white text-sm font-medium">{text}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-xs font-medium">Live</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
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
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]/50 transition-all" />
    </div>
  );
}
