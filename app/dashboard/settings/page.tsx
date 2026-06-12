"use client";

import { useState, useEffect } from "react";
import { Save, ExternalLink, CheckCircle, Plus, Trash2, ChevronUp, ChevronDown, CreditCard, AlertCircle } from "lucide-react";

// ─── Price Book tab ────────────────────────────────────────────────────────────
interface PriceBookItem {
  id: string; name: string; description: string | null;
  priceMin: string | number; priceMax: string | number;
  unit: string; isActive: boolean; sortOrder: number;
}

function PriceBookTab() {
  const [items, setItems]   = useState<PriceBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ name: "", priceMin: "", priceMax: "", unit: "flat", description: "" });
  const [adding, setAdding]   = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    const res = await fetch("/api/pricebook").catch(() => null);
    if (res?.ok) setItems(await res.json());
    setLoading(false);
  }

  async function deleteItem(id: string) {
    await fetch(`/api/pricebook/${id}`, { method: "DELETE" });
    loadItems();
  }

  async function toggleActive(item: PriceBookItem) {
    await fetch(`/api/pricebook/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    loadItems();
  }

  async function moveItem(idx: number, dir: -1 | 1) {
    const target = items[idx + dir];
    const current = items[idx];
    if (!target) return;
    await Promise.all([
      fetch(`/api/pricebook/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: target.sortOrder }) }),
      fetch(`/api/pricebook/${target.id}`,  { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: current.sortOrder }) }),
    ]);
    loadItems();
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    await fetch("/api/pricebook", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, sortOrder: items.length }),
    });
    setAddForm({ name: "", priceMin: "", priceMax: "", unit: "flat", description: "" });
    setShowAdd(false);
    setAdding(false);
    loadItems();
  }

  if (loading) return <div className="text-gray-400 text-sm py-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{items.length} services · AI quotes from this list</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm bg-[#1a2744] text-white px-3 py-1.5 rounded-lg hover:bg-[#243460]">
          <Plus size={13} /> Add service
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          No services yet. Add your first service or complete onboarding to auto-populate.
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${item.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:invisible"><ChevronUp size={13} /></button>
              <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="text-gray-300 hover:text-gray-500 disabled:invisible"><ChevronDown size={13} /></button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0d1117] truncate">{item.name}</p>
              {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
            </div>
            <span className="text-sm font-semibold text-[#0d1117] shrink-0">
              ${Number(item.priceMin).toFixed(0)}–${Number(item.priceMax).toFixed(0)}
              <span className="text-xs text-gray-400 font-normal ml-1">{item.unit}</span>
            </span>
            <button onClick={() => toggleActive(item)} className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
              {item.isActive ? "Active" : "Off"}
            </button>
            <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-400 ml-1"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Service</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <form onSubmit={addItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Service Name *</label>
                <input required value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</label>
                <input value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Min $</label>
                  <input type="number" required min={0} value={addForm.priceMin} onChange={(e) => setAddForm((f) => ({ ...f, priceMin: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Max $</label>
                  <input type="number" required min={0} value={addForm.priceMax} onChange={(e) => setAddForm((f) => ({ ...f, priceMax: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Unit</label>
                  <select value={addForm.unit} onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                    <option value="flat">flat</option>
                    <option value="hourly">hourly</option>
                    <option value="per_sqft">per sqft</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={adding}
                  className="flex-1 bg-[#1a2744] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#243460] disabled:opacity-60">
                  {adding ? "Adding..." : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payments tab ──────────────────────────────────────────────────────────────
function PaymentsTab() {
  const [status, setStatus] = useState<{ connected: boolean; chargesEnabled: boolean; onboardedAt?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  useEffect(() => {
    fetch("/api/payments/connect/status").then((r) => r.json()).then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function startConnect() {
    setConnecting(true);
    setConnectError("");
    const res = await fetch("/api/payments/connect/start", { method: "POST" }).catch(() => null);
    if (res?.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      const body = await res?.json().catch(() => ({}));
      setConnectError(body?.error || "Failed to connect Stripe. Check that STRIPE_SECRET_KEY is set correctly in your environment.");
      setConnecting(false);
    }
  }

  if (loading) return <div className="text-gray-400 text-sm py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      {status?.chargesEnabled ? (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Stripe Connect active</p>
            <p className="text-xs text-green-700 mt-0.5">Payment links are automatically created when you mark jobs complete. Platform fee: 1%.</p>
          </div>
        </div>
      ) : status?.connected ? (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <AlertCircle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Stripe onboarding in progress</p>
            <p className="text-xs text-yellow-700 mt-0.5">Your Stripe account isn&apos;t fully approved yet. Complete onboarding to enable payments.</p>
            <button onClick={startConnect} disabled={connecting}
              className="mt-2 text-xs text-yellow-800 underline hover:no-underline disabled:opacity-60">
              {connecting ? "Loading..." : "Continue Stripe onboarding →"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">Connect your Stripe account to collect payments via secure payment links. We charge 1% per transaction on top of Stripe&apos;s fee.</p>
          <button onClick={startConnect} disabled={connecting}
            className="flex items-center gap-2 bg-[#635bff] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#5851e5] disabled:opacity-60 transition-colors">
            <CreditCard size={16} />
            {connecting ? "Redirecting to Stripe..." : "Connect Stripe to get paid"}
          </button>
          {connectError && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              {connectError}
            </div>
          )}
        </div>
      )}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p>• When you mark a job complete, a payment link is created and sent to your customer.</p>
        <p>• Customers pay via card — funds deposit to your Stripe account within 2 business days.</p>
        <p>• Disputes and refunds are handled through your Stripe dashboard.</p>
      </div>
    </div>
  );
}

const INDUSTRIES = [
  "HVAC","Plumbing","Electrical","Cleaning","Landscaping","Roofing",
  "Auto Detailing","Pest Control","Pool Service","Appliance Repair",
  "Handyman","Painting","Flooring","General Contractor","Other",
];

interface BizData {
  name: string; industry: string; phone: string; email: string;
  address: string; city: string; slug: string; googleBusinessUrl: string;
  profile?: { headline: string; description: string; services: string; };
  googleConnection?: { reviewUrl: string | null; locationId: string | null; } | null;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

const SETTINGS_TABS = ["Business", "Price Book", "Payments"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Business");
  const [biz, setBiz] = useState<BizData>({
    name: "", industry: "", phone: "", email: "",
    address: "", city: "", slug: "", googleBusinessUrl: "",
    profile: { headline: "", description: "", services: "" },
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
        services: biz.profile?.services,
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
      <h1 className="text-2xl font-bold text-[#0d1117] mb-4">Settings</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        {SETTINGS_TABS.map((t) => (
          <button key={t} type="button" onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === t ? "bg-white text-[#0d1117] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Price Book" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-[#0d1117] mb-1">Price Book</h2>
          <p className="text-gray-400 text-xs mb-5">AI quotes customers from this list. Services not here get an estimate visit.</p>
          <PriceBookTab />
        </div>
      )}

      {activeTab === "Payments" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-[#0d1117] mb-1">Payments</h2>
          <p className="text-gray-400 text-xs mb-5">Accept card payments via Stripe. Funds go directly to your account.</p>
          <PaymentsTab />
        </div>
      )}

      {activeTab === "Business" && <form onSubmit={handleSave} className="space-y-6">

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
              {process.env.NEXT_PUBLIC_APP_URL}/b/{biz.slug || "your-slug"} <ExternalLink size={10} />
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
          </div>
        </section>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-[#1a2744] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#243460] transition-colors disabled:opacity-60">
          <Save size={16} />
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </form>}
    </div>
  );
}
