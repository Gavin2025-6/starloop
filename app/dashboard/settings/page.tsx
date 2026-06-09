"use client";

import { useState, useEffect } from "react";
import { Save, ExternalLink } from "lucide-react";

const INDUSTRIES = [
  "HVAC","Plumbing","Electrical","Cleaning","Landscaping","Roofing",
  "Auto Detailing","Pest Control","Pool Service","Appliance Repair",
  "Handyman","Painting","Flooring","General Contractor","Other",
];

interface BizData {
  name: string; industry: string; phone: string; email: string;
  address: string; city: string; slug: string; googleBusinessUrl: string;
  profile?: { headline: string; description: string; services: string; bookingUrl: string; };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export default function SettingsPage() {
  const [biz, setBiz] = useState<BizData>({
    name: "", industry: "", phone: "", email: "",
    address: "", city: "", slug: "", googleBusinessUrl: "",
    profile: { headline: "", description: "", services: "", bookingUrl: "" },
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
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Google Business URL</label>
              <input type="url" value={biz.googleBusinessUrl} onChange={(e) => setBiz((b) => ({ ...b, googleBusinessUrl: e.target.value }))}
                placeholder="https://g.page/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
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
