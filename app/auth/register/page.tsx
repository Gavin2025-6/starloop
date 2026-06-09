"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDUSTRIES = [
  "HVAC","Plumbing","Electrical","Cleaning","Landscaping","Roofing",
  "Auto Detailing","Pest Control","Pool Service","Appliance Repair",
  "Handyman","Painting","Flooring","General Contractor","Other",
];

interface FormData {
  name: string;
  email: string;
  password: string;
  businessName: string;
  industry: string;
  phone: string;
}

interface CustomerRow { name: string; phone: string; email: string; lastServiceDate: string; totalSpend: string; }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ name: "", email: "", password: "", businessName: "", industry: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [csvPreview, setCsvPreview] = useState<CustomerRow[]>([]);
  const [csvRaw, setCsvRaw] = useState("");
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [slug, setSlug] = useState("");
  const [services, setServices] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState<{ active: number; atRisk: number; lost: number; total: number } | null>(null);

  function setField(k: keyof FormData, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "businessName") setSlug(slugify(v));
  }

  // Step 1: Register account
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
    setUserId(data.id);
    setLoading(false);
    setStep(2);
  }

  // Step 2: CSV parse
  function handleCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvRaw(text);
      const lines = text.trim().split("\n").slice(1, 6);
      const rows = lines.map((l) => {
        const [name = "", phone = "", email = "", lastServiceDate = "", totalSpend = ""] = l.split(",").map((c) => c.trim());
        return { name, phone, email, lastServiceDate, totalSpend };
      });
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!csvRaw) { setStep(3); return; }
    setImporting(true);
    await fetch("/api/customers/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvRaw }),
    });
    setImporting(false);
    setImportDone(true);
    setTimeout(() => setStep(3), 800);
  }

  // Step 3: Public profile
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Update business with slug/services/bookingUrl via settings API
    await fetch("/api/business/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, services, bookingUrl }),
    });
    setLoading(false);
    setStep(4);
    // Trigger analysis
    const r = await fetch("/api/customers/analyze", { method: "POST" });
    const d = await r.json();
    setAnalysisResult(d);
  }

  // Step 4 → dashboard
  async function goToDashboard() {
    // Sign in automatically
    const { signIn } = await import("next-auth/react");
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/dashboard");
  }

  const stepLabels = ["Account", "Customers", "Profile", "Results"];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1a2744] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold text-[#1a2744]">Service Star</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-[#1a2744] text-white" : "bg-gray-200 text-gray-400"
                }`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">{label}</span>
              </div>
              {i < 3 && <div className={`h-0.5 w-12 mx-1 mb-4 ${step > i + 1 ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {/* Step 1 */}
          {step === 1 && (
            <>
              <h2 className="font-bold text-[#1a2744] text-lg mb-1">Create your account</h2>
              <p className="text-gray-400 text-sm mb-5">Get started free — no credit card needed.</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">{error}</div>}
              <form onSubmit={handleStep1} className="space-y-3">
                {([
                  { k: "name", label: "Your Name", type: "text" },
                  { k: "email", label: "Email", type: "email" },
                  { k: "password", label: "Password (min 6 chars)", type: "password" },
                  { k: "businessName", label: "Business Name", type: "text" },
                ] as { k: keyof FormData; label: string; type: string }[]).map(({ k, label, type }) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                    <input type={type} value={form[k]} onChange={(e) => setField(k, e.target.value)} required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Industry</label>
                  <select value={form.industry} onChange={(e) => setField("industry", e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 bg-white">
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone (optional)</label>
                  <input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#f97316] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-60 mt-2">
                  {loading ? "Creating account..." : "Create Account →"}
                </button>
              </form>
              <p className="text-center text-xs text-gray-400 mt-4">
                Already have an account? <Link href="/auth/login" className="text-[#1a2744] font-medium hover:underline">Sign in</Link>
              </p>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <h2 className="font-bold text-[#1a2744] text-lg mb-1">Import your customers</h2>
              <p className="text-gray-400 text-sm mb-5">Upload a CSV file or skip for now.</p>

              {/* Download template */}
              <a href="data:text/csv;charset=utf-8,name,phone,email,lastServiceDate,totalSpend%0AJohn Smith,+14165550001,john@email.com,2025-12-15,450%0AJane Doe,+14165550002,jane@email.com,2025-10-20,820"
                download="customers-template.csv"
                className="flex items-center gap-2 text-xs text-[#1a2744] border border-[#1a2744]/20 rounded-lg px-3 py-2 w-fit mb-4 hover:bg-blue-50">
                ↓ Download CSV Template
              </a>

              {/* Drop zone */}
              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#1a2744]/30 transition-colors mb-4">
                <div className="text-3xl mb-2">📄</div>
                <div className="text-sm font-medium text-gray-600">Drop CSV here or click to upload</div>
                <div className="text-xs text-gray-400 mt-1">name, phone, email, lastServiceDate, totalSpend</div>
                <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />
              </label>

              {csvPreview.length > 0 && (
                <div className="mb-4 overflow-x-auto">
                  <p className="text-xs font-medium text-gray-500 mb-2">Preview (first 5 rows):</p>
                  <table className="w-full text-xs border-collapse">
                    <thead><tr className="bg-gray-50">
                      {["Name","Phone","Last Service","Spend"].map((h) => (
                        <th key={h} className="text-left px-2 py-1 text-gray-400 font-medium border border-gray-100">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{csvPreview.map((r, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1 border border-gray-100">{r.name}</td>
                        <td className="px-2 py-1 border border-gray-100">{r.phone}</td>
                        <td className="px-2 py-1 border border-gray-100">{r.lastServiceDate}</td>
                        <td className="px-2 py-1 border border-gray-100">${r.totalSpend}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Skip for now
                </button>
                <button onClick={handleImport} disabled={importing}
                  className="flex-1 bg-[#1a2744] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#243460] disabled:opacity-60">
                  {importing ? "Importing..." : importDone ? "✓ Imported!" : csvRaw ? "Import & Continue →" : "Continue →"}
                </button>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <h2 className="font-bold text-[#1a2744] text-lg mb-1">Set up your public profile</h2>
              <p className="text-gray-400 text-sm mb-5">Customers can find and book you at <span className="font-mono text-[#1a2744]">servicestar.app/b/{slug || "your-business"}</span></p>
              <form onSubmit={handleStep3} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your URL Slug</label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <span className="bg-gray-50 px-3 py-2.5 text-xs text-gray-400 border-r border-gray-200">/b/</span>
                    <input type="text" value={slug} onChange={(e) => setSlug(slugify(e.target.value))}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none" placeholder="your-business-name" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Services Offered</label>
                  <textarea rows={3} value={services} onChange={(e) => setServices(e.target.value)}
                    placeholder="e.g. Water heater repair, Drain cleaning, Emergency plumbing..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Booking URL (optional)</label>
                  <input type="url" value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setStep(4)}
                    className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Skip
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-[#1a2744] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#243460] disabled:opacity-60">
                    {loading ? "Saving..." : "Save & Analyze →"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="font-bold text-[#1a2744] text-xl mb-2">Your revenue loop is ready!</h2>
              {analysisResult ? (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm font-semibold text-[#1a2744] mb-3">Customer Analysis Complete</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{analysisResult.active}</div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#f97316]">{analysisResult.atRisk}</div>
                      <div className="text-xs text-gray-500">At-Risk</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">{analysisResult.lost}</div>
                      <div className="text-xs text-gray-500">Lost</div>
                    </div>
                  </div>
                  {(analysisResult.atRisk + analysisResult.lost) > 0 && (
                    <p className="text-xs text-[#f97316] font-semibold mt-3 text-center">
                      Found {analysisResult.atRisk + analysisResult.lost} customers to recover!
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-6">Analyzing your customer data...</p>
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
