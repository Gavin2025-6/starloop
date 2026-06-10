"use client";

import { useState, useEffect } from "react";
import { Save, ExternalLink, Clock } from "lucide-react";

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

interface AvailData {
  workingDays: { mon: boolean; tue: boolean; wed: boolean; thu: boolean; fri: boolean; sat: boolean; sun: boolean };
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  timezone: string;
}

const DEFAULT_AVAIL: AvailData = {
  workingDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
  startTime: "08:00",
  endTime: "18:00",
  slotDuration: 120,
  bufferTime: 30,
  timezone: "America/Toronto",
};

const TIMEZONES = [
  "America/Toronto", "America/New_York", "America/Chicago",
  "America/Denver", "America/Los_Angeles", "America/Vancouver",
  "America/Edmonton", "America/Winnipeg", "America/Halifax",
];

const DAYS: { key: keyof AvailData["workingDays"]; label: string }[] = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" }, { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" }, { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" }, { key: "sun", label: "Sun" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export default function SettingsPage() {
  const [biz, setBiz] = useState<BizData>({
    name: "", industry: "", phone: "", email: "",
    address: "", city: "", slug: "", googleBusinessUrl: "",
    profile: { headline: "", description: "", services: "", bookingUrl: "" },
  });
  const [avail, setAvail] = useState<AvailData>(DEFAULT_AVAIL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const [savedAvail, setSavedAvail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/business/profile").then((r) => r.json()),
      fetch("/api/availability").then((r) => r.json()),
    ])
      .then(([d, a]) => {
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
        setAvail({
          workingDays: a.workingDays ?? DEFAULT_AVAIL.workingDays,
          startTime: a.startTime ?? "08:00",
          endTime: a.endTime ?? "18:00",
          slotDuration: a.slotDuration ?? 120,
          bufferTime: a.bufferTime ?? 30,
          timezone: a.timezone ?? "America/Toronto",
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

  async function handleSaveAvail(e: React.FormEvent) {
    e.preventDefault();
    setSavingAvail(true);
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(avail),
    });
    if (res.ok) { setSavedAvail(true); setTimeout(() => setSavedAvail(false), 2500); }
    setSavingAvail(false);
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

      {/* Availability Settings */}
      <form onSubmit={handleSaveAvail} className="space-y-6 mt-8">
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-[#0d1117] mb-1 flex items-center gap-2">
            <Clock size={16} /> Availability
          </h2>
          <p className="text-gray-400 text-xs mb-5">Control when customers can book appointments.</p>

          {/* Working days */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Working Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAvail((a) => ({ ...a, workingDays: { ...a.workingDays, [key]: !a.workingDays[key] } }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    avail.workingDays[key]
                      ? "bg-[#1a2744] text-white border-[#1a2744]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Start Time</label>
              <input type="time" value={avail.startTime}
                onChange={(e) => setAvail((a) => ({ ...a, startTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">End Time</label>
              <input type="time" value={avail.endTime}
                onChange={(e) => setAvail((a) => ({ ...a, endTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Slot Duration (min)</label>
              <input type="number" min={30} max={480} step={15} value={avail.slotDuration}
                onChange={(e) => setAvail((a) => ({ ...a, slotDuration: parseInt(e.target.value) || 120 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Buffer Between Jobs (min)</label>
              <input type="number" min={0} max={120} step={15} value={avail.bufferTime}
                onChange={(e) => setAvail((a) => ({ ...a, bufferTime: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Timezone</label>
            <select value={avail.timezone}
              onChange={(e) => setAvail((a) => ({ ...a, timezone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 bg-white">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </section>

        <button type="submit" disabled={savingAvail}
          className="flex items-center gap-2 bg-[#1a2744] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#243460] transition-colors disabled:opacity-60">
          <Save size={16} />
          {savingAvail ? "Saving..." : savedAvail ? "✓ Saved!" : "Save Availability"}
        </button>
      </form>
    </div>
  );
}
