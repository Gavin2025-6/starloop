"use client";

import { useState, useEffect } from "react";
import { Save, ExternalLink, CheckCircle } from "lucide-react";

const INDUSTRIES = [
  "HVAC","Plumbing","Electrical","Cleaning","Landscaping","Roofing",
  "Auto Detailing","Pest Control","Pool Service","Appliance Repair",
  "Handyman","Painting","Flooring","General Contractor","Other",
];

interface BizData {
  name: string; industry: string; phone: string; email: string;
  address: string; city: string; slug: string; googleBusinessUrl: string;
  profile?: { headline: string; description: string; services: string; bookingUrl: string; };
  googleConnection?: { reviewUrl: string | null; locationId: string | null; } | null;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export default function SettingsPage() {
  const [biz, setBiz] = useState<BizData>({
    name: "", industry: "", phone: "", email: "",
    address: "", city: "", slug: "", googleBusinessUrl: "",
    profile: { headline: "", description: "", services: "", bookingUrl: "" },
    googleConnection: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/business/profile")
      .then((r) => r.json())
      .then((d) => {
        setBiz({
          name: d.name ?? "",
          industry: d.industry ?? "",
          phone: d.phone ?? "",
          email: d.email ?? "",
          address: d.address ?? "",
          city: d.city ?? "",
          slug: d.slug ?? "",
          googleBusinessUrl: d.googleBusinessUrl ?? "",
          profile: {
            headline: d.profile?.headline ?? "",
            description: d.profile?.description ?? "",
            services: d.profile?.services ?? "",
            bookingUrl: d.profile?.bookingUrl ?? "",
          },
          googleConnection: d.googleConnection ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/business/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: biz.name, industry: biz.industry, phone: biz.phone,
        email: biz.email, address: biz.address, city: biz.city,
        slug: biz.slug, googleBusinessUrl: biz.googleBusinessUrl,
        headline: biz.profile?.headline, description: biz.profile?.description,
        services: biz.profile?.services, bookingUrl: biz.profile?.bookingUrl,
      }),
    });
    if (!res.ok) { setError("Save failed. Try again."); }
    else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setSaving(false);
  }

  function setProfile(k: keyof NonNullable<BizData["profile"]>, v: string) {
    setBiz((b) => ({ ...b, profile: { ...(b.profile ?? {}), [k]: v } as BizData["profile"] }));
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading settings...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#0d1117] mb-6">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Business Profile */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-[#0d1117] mb-5 flex items-center gap-2">
            Business Profile
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Business Name *</label>
                <input value={biz.name} onChange={(e) => setBiz((b) => ({ ...b, name: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Industry *</label>
                <select value={biz.industry} onChange={(e) => setBiz((b) => ({ ...b, industry: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 bg-white">
                  <option value="">Select...</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</label>
                <input type="tel" value={biz.phone} onChange={(e) => setBiz((b) => ({ ...b, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <input type="email" value={biz.email} onChange={(e) => setBiz((b) => ({ ...b, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</label>
                <input value={biz.address} onChange={(e) => setBiz((b) => ({ ...b, address: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">City</label>
                <input value={biz.city} onChange={(e) => setBiz((b) => ({ ...b, city: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Google Business</label>
              {biz.googleConnection ? (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <CheckCircle size={16} className="text-green-600 shrink-0" />
                  <span className="text-green-700 font-medium">Google Business Connected</span>
                  {biz.googleConnection.reviewUrl && (
                    <a href={biz.googleConnection.reviewUrl} target="_blank" rel="noopener"
                      className="ml-auto text-xs text-green-600 hover:underline inline-flex items-center gap-1">
                      View <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ) : (
                <a href="/api/google/connect"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-[#0d1117] hover:bg-gray-50 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Connect Google Business
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Public Profile / Slug */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-[#0d1117] mb-1">Public Profile</h2>
          <p className="text-gray-400 text-xs mb-5">
            Your public page: <a href={`/b/${biz.slug || "your-slug"}`} target="_blank" rel="noopener"
              className="text-[#1a2744] hover:underline inline-flex items-center gap-1">
              servicestar.app/b/{biz.slug || "your-slug"} <ExternalLink size={10} />
            </a>
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">URL Slug</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <span className="bg-gray-50 px-3 py-2.5 text-xs text-gray-400 border-r border-gray-200">/b/</span>
                <input value={biz.slug}
                  onChange={(e) => setBiz((b) => ({ ...b, slug: slugify(e.target.value) }))}
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Headline</label>
              <input value={biz.profile?.headline ?? ""} onChange={(e) => setProfile("headline", e.target.value)}
                placeholder="e.g. Toronto's most trusted plumber"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</label>
              <textarea rows={3} value={biz.profile?.description ?? ""} onChange={(e) => setProfile("description", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Services (comma-separated)</label>
              <input value={biz.profile?.services ?? ""} onChange={(e) => setProfile("services", e.target.value)}
                placeholder="Drain cleaning, Water heater, Emergency plumbing"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Booking URL</label>
              <input type="url" value={biz.profile?.bookingUrl ?? ""} onChange={(e) => setProfile("bookingUrl", e.target.value)}
                placeholder="https://calendly.com/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
            </div>
          </div>
        </section>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-[#1a2744] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#243460] transition-colors disabled:opacity-60">
          <Save size={16} />
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
