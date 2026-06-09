"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDUSTRIES = [
  "HVAC","Plumbing","Electrical","Cleaning","Landscaping","Roofing",
  "Auto Detailing","Pest Control","Pool Service","Appliance Repair",
  "Handyman","Painting","Flooring","General Contractor","Other",
];

interface FormData {
  name: string; email: string; password: string;
  businessName: string; industry: string; phone: string;
}
interface CustomerForm {
  name: string; phone: string; lastServiceDate: string; totalSpend: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: "", email: "", password: "", businessName: "", industry: "", phone: "",
  });
  const [customer, setCustomer] = useState<CustomerForm>({
    name: "", phone: "", lastServiceDate: "", totalSpend: "",
  });
  const [slug, setSlug] = useState("");
  const [services, setServices] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState<{ active: number; atRisk: number; lost: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(k: keyof FormData, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "businessName") setSlug(slugify(v));
  }

  // ── Step 1: Register + immediately sign in ─────────────────────
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    // 1. Create account
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }

    // 2. Sign in immediately while we have the password in state
    const loginResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (loginResult?.error) {
      setError("Account created but login failed — please sign in manually.");
      setLoading(false);
      router.push("/auth/login");
      return;
    }

    setLoading(false);
    setStep(2);
  }

  // ── Step 2: Add first customer ─────────────────────────────────
  async function handleStep2(e: React.FormEvent) {
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
    setLoading(false);
    setStep(3);
  }

  // ── Step 3: Public profile ─────────────────────────────────────
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/business/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, services, bookingUrl }),
    });
    setLoading(false);
    setStep(4);
    // Trigger analysis in background
    fetch("/api/customers/analyze", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setAnalysisResult(d))
      .catch(() => {});
  }

  // ── Step 4 → Dashboard ─────────────────────────────────────────
  // Already signed in from Step 1 — just navigate
  function goToDashboard() {
    router.push("/dashboard");
  }

  const stepLabels = ["Account", "First Customer", "Profile", "Results"];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1a2744] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold text-[#1a2744]">Service Star</span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 px-1">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > i + 1 ? "bg-green-500 text-white"
                  : step === i + 1 ? "bg-[#1a2744] text-white"
                  : "bg-gray-200 text-gray-400"
                }`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 text-center leading-tight max-w-[52px]">{label}</span>
              </div>
              {i < 3 && (
                <div className={`h-0.5 w-8 mx-1 mb-4 transition-colors ${step > i + 1 ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <>
              <h2 className="font-bold text-[#1a2744] text-lg mb-1">Create your account</h2>
              <p className="text-gray-400 text-sm mb-5">Free forever · No credit card needed</p>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>
              )}
              <form onSubmit={handleStep1} className="space-y-3">
                <Field label="Your Name" type="text" value={form.name} onChange={(v) => setField("name", v)} required />
                <Field label="Email" type="email" value={form.email} onChange={(v) => setField("email", v)} required />
                <Field label="Password (min 6 chars)" type="password" value={form.password} onChange={(v) => setField("password", v)} required />
                <Field label="Business Name" type="text" value={form.businessName} onChange={(v) => setField("businessName", v)} required />
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Industry</label>
                  <select value={form.industry} onChange={(e) => setField("industry", e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 bg-white">
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <Field label="Phone (optional)" type="tel" value={form.phone} onChange={(v) => setField("phone", v)} />
                <button type="submit" disabled={loading}
                  className="w-full bg-[#f97316] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-60 mt-2">
                  {loading ? "Creating account..." : "Create Account →"}
                </button>
              </form>
              <p className="text-center text-xs text-gray-400 mt-4">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-[#1a2744] font-medium hover:underline">Sign in</Link>
              </p>
            </>
          )}

          {/* ── Step 2: Add first customer ── */}
          {step === 2 && (
            <>
              <h2 className="font-bold text-[#1a2744] text-lg mb-1">Add a customer to get started</h2>
              <p className="text-gray-400 text-sm mb-5">
                We&apos;ll use this to show you how recovery works.
              </p>
              <form onSubmit={handleStep2} className="space-y-4">
                <Field label="Customer Name *" type="text" value={customer.name}
                  onChange={(v) => setCustomer((c) => ({ ...c, name: v }))} required />
                <Field label="Phone Number *" type="tel" value={customer.phone}
                  onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))} required
                  placeholder="+1 416 555 0100" />
                <Field label="Last Service Date *" type="date" value={customer.lastServiceDate}
                  onChange={(v) => setCustomer((c) => ({ ...c, lastServiceDate: v }))} required />
                <Field label="Amount Spent ($)" type="number" value={customer.totalSpend}
                  onChange={(v) => setCustomer((c) => ({ ...c, totalSpend: v }))}
                  placeholder="0" />
                <button type="submit" disabled={loading}
                  className="w-full bg-[#f97316] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-60">
                  {loading ? "Saving..." : "Add Customer & Continue →"}
                </button>
              </form>
              <button onClick={() => setStep(3)}
                className="block w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-600">
                Skip for now →
              </button>
            </>
          )}

          {/* ── Step 3: Public profile ── */}
          {step === 3 && (
            <>
              <h2 className="font-bold text-[#1a2744] text-lg mb-1">Set up your public profile</h2>
              <p className="text-gray-400 text-sm mb-5">
                Customers can find you at{" "}
                <span className="font-mono text-[#1a2744] text-xs">
                  servicestar.app/b/{slug || "your-business"}
                </span>
              </p>
              <form onSubmit={handleStep3} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your URL Slug</label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <span className="bg-gray-50 px-3 py-2.5 text-xs text-gray-400 border-r border-gray-200">/b/</span>
                    <input type="text" value={slug} onChange={(e) => setSlug(slugify(e.target.value))}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      placeholder="your-business-name" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Services Offered</label>
                  <textarea rows={2} value={services} onChange={(e) => setServices(e.target.value)}
                    placeholder="e.g. Water heater repair, Drain cleaning..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none" />
                </div>
                <Field label="Booking URL (optional)" type="url" value={bookingUrl}
                  onChange={setBookingUrl} placeholder="https://..." />
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { setStep(4); fetch("/api/customers/analyze", { method: "POST" }).then((r) => r.json()).then(setAnalysisResult).catch(() => {}); }}
                    className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Skip
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-[#1a2744] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#243460] disabled:opacity-60">
                    {loading ? "Saving..." : "Save & Continue →"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 4: Results ── */}
          {step === 4 && (
            <div className="text-center py-2">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="font-bold text-[#1a2744] text-xl mb-2">You&apos;re all set!</h2>
              <p className="text-gray-400 text-sm mb-6">Your revenue recovery loop is ready.</p>

              {analysisResult ? (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer Snapshot</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{analysisResult.active}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Active</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#f97316]">{analysisResult.atRisk}</div>
                      <div className="text-xs text-gray-500 mt-0.5">At-Risk</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">{analysisResult.lost}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Lost</div>
                    </div>
                  </div>
                  {(analysisResult.atRisk + analysisResult.lost) > 0 && (
                    <p className="text-xs text-[#f97316] font-semibold mt-3 text-center">
                      {analysisResult.atRisk + analysisResult.lost} customers ready to recover!
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-400">Analyzing your customers...</p>
                </div>
              )}

              <button onClick={goToDashboard}
                className="w-full bg-[#f97316] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                Go to Dashboard →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Reusable field component
function Field({
  label, type, value, onChange, required, placeholder,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
    </div>
  );
}
