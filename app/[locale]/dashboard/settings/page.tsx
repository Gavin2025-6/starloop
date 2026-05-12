"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

const CATEGORIES = [
  "Cleaning", "Landscaping", "Restaurant", "Renovation", "Nail Salon",
  "Auto Repair", "Plumbing", "Electrical", "Moving", "Other",
];

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    features: ["10 SMS/month", "Review Gate", "Private feedback capture"],
    color: "border-gray-200",
    badge: "bg-gray-100 text-gray-600",
  },
  {
    key: "STARTER",
    name: "Starter",
    price: "$39/mo",
    features: ["Unlimited SMS", "AI reply generation", "Google Business sync", "Email channel"],
    color: "border-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    key: "PRO",
    name: "Pro",
    price: "$79/mo",
    features: ["Everything in Starter", "Up to 5 locations", "Analytics & reporting", "Priority support"],
    color: "border-purple-500",
    badge: "bg-purple-100 text-purple-700",
  },
];

// ─── Password confirm modal ───────────────────────────────────────────────────

function PasswordModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (pwd: string) => void;
  onCancel: () => void;
}) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setPwd(""); setError(""); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  async function handleConfirm() {
    if (!pwd) { setError("Please enter your password."); return; }
    setChecking(true);
    const res = await fetch("/api/auth/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    const data = await res.json();
    setChecking(false);
    if (data.valid) {
      onConfirm(pwd);
    } else {
      setError("Incorrect password. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Confirm your password</h3>
        <p className="text-sm text-gray-500 mb-4">Enter your current password to save these changes.</p>
        <input
          ref={inputRef}
          type="password"
          value={pwd}
          onChange={(e) => { setPwd(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); if (e.key === "Escape") onCancel(); }}
          placeholder="Current password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={checking}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {checking ? "Checking…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const googleParam = searchParams.get("google");
  const paymentParam = searchParams.get("payment");

  // ── Personal profile
  const [userName, setUserName]       = useState("");
  const [userEmail, setUserEmail]     = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // ── Business profile
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug]               = useState("");
  const [slugError, setSlugError]     = useState("");
  const [category, setCategory]       = useState("");
  const [businessSaved, setBusinessSaved] = useState(false);
  const [businessError, setBusinessError] = useState("");

  // ── Quick-save fields (no password)
  const [tone, setTone]               = useState("WARM");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [quickSaved, setQuickSaved]   = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // ── Subscription
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [upgrading, setUpgrading]     = useState<string | null>(null);

  // ── Widget
  const [businessId, setBusinessId]   = useState("");
  const [widgetCopied, setWidgetCopied] = useState(false);

  // ── Loading / modal
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<"profile" | "business" | null>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => { if (d) { setUserName(d.name ?? ""); setUserEmail(d.email ?? ""); } })
      .catch(() => {});

    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setBusinessName(d.name ?? "");
          setSlug(d.slug ?? "");
          setCategory(d.category ?? "");
          setTone(d.aiReplyTone ?? "WARM");
          setIsGoogleConnected(d.isGoogleConnected ?? false);
          setGoogleReviewUrl(d.googleReviewUrl ?? "");
          setBusinessId(d.id ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => setCurrentPlan(d.plan ?? "FREE"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (googleParam === "connected") setIsGoogleConnected(true);
  }, [googleParam]);

  // ── Save handlers (called after password confirmed)

  async function doSaveProfile() {
    setProfileError("");
    const body: Record<string, string> = {};
    if (userName) body.name = userName;
    if (userEmail) body.email = userEmail;
    if (newPassword) body.newPassword = newPassword;

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setProfileError(data.error ?? "Save failed"); return; }
    setNewPassword("");
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function doSaveBusiness() {
    setSlugError(""); setBusinessError("");
    const cleanSlug = slug.trim().toLowerCase()
      .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: businessName, slug: cleanSlug || null, category }),
    });
    if (res.status === 409) { setSlugError("This URL slug is already taken."); return; }
    if (!res.ok) { setBusinessError("Save failed"); return; }
    setSlug(cleanSlug);
    setBusinessSaved(true);
    setTimeout(() => setBusinessSaved(false), 2500);
  }

  async function handleQuickSave() {
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiReplyTone: tone, googleReviewUrl: googleReviewUrl || null }),
    });
    if (res.ok) { setQuickSaved(true); setTimeout(() => setQuickSaved(false), 2500); }
  }

  async function handleUpgrade(planKey: string) {
    setUpgrading(planKey);
    try {
      if (currentPlan !== "FREE") {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* ignore */ }
    finally { setUpgrading(null); }
  }

  return (
    <div className="max-w-2xl">
      <PasswordModal
        open={modal !== null}
        onConfirm={async () => {
          setModal(null);
          if (modal === "profile") await doSaveProfile();
          if (modal === "business") await doSaveBusiness();
        }}
        onCancel={() => setModal(null)}
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("settings.title")}</h1>

      {/* Banners */}
      {googleParam === "error" && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">Google授权失败，请重试。</div>
      )}
      {googleParam === "connected" && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">Google Business 已成功连接！</div>
      )}
      {paymentParam === "success" && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">🎉 Payment successful! Your plan has been upgraded.</div>
      )}
      {paymentParam === "cancelled" && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">Payment cancelled. Your plan was not changed.</div>
      )}

      <div className="space-y-6">

        {/* ── Subscription ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Subscription Plan</h2>
          <p className="text-xs text-gray-400 mb-4">Current plan: <span className="font-semibold text-gray-700">{currentPlan}</span></p>
          <div className="grid grid-cols-3 gap-3">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.key;
              return (
                <div key={plan.key} className={`rounded-xl border-2 p-4 ${isCurrent ? plan.color : "border-gray-100"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
                    {isCurrent && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.badge}`}>Current</span>}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-3">{plan.price}</div>
                  <ul className="space-y-1 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs text-gray-500 flex gap-1"><span className="text-green-500">✓</span> {f}</li>
                    ))}
                  </ul>
                  {!isCurrent && plan.key !== "FREE" && (
                    <button onClick={() => handleUpgrade(plan.key)} disabled={upgrading === plan.key}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${plan.key === "PRO" ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                      {upgrading === plan.key ? "..." : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                  {isCurrent && plan.key !== "FREE" && (
                    <button onClick={() => handleUpgrade(plan.key)}
                      className="w-full py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
                      Manage Billing
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Personal Profile ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Personal Profile</h2>
          <p className="text-xs text-gray-400 mb-4">Password required to save changes</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Your Name</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">New Password <span className="text-gray-400 text-xs">(leave blank to keep current)</span></label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {profileError && <p className="text-xs text-red-500">{profileError}</p>}
            <button onClick={() => setModal("profile")}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              {profileSaved ? "✓ Saved" : "Save Profile"}
            </button>
          </div>
        </div>

        {/* ── Business Profile ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Business Profile</h2>
          <p className="text-xs text-gray-400 mb-4">Password required to save changes</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("settings.businessName")}</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Mini-Website URL slug
                <span className="text-xs text-gray-400 ml-2">(your public review page)</span>
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="bg-gray-50 border-r border-gray-300 px-3 py-2 text-xs text-gray-400 whitespace-nowrap">starloop.app/r/</span>
                <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugError(""); }}
                  placeholder="my-business-name"
                  className="flex-1 px-3 py-2 text-sm focus:outline-none" />
              </div>
              {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
              {slug && !slugError && (
                <a href={`/r/${slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Preview page →</a>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("settings.businessCategory")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {businessError && <p className="text-xs text-red-500">{businessError}</p>}
            <button onClick={() => setModal("business")}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              {businessSaved ? "✓ Saved" : "Save Business"}
            </button>
          </div>
        </div>

        {/* ── AI Tone (no password) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">{t("settings.aiTone")}</h2>
          <p className="text-xs text-gray-400 mb-4">Saves instantly — no password needed</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { value: "PROFESSIONAL", label: t("settings.professional"), emoji: "👔" },
              { value: "WARM",         label: t("settings.warm"),         emoji: "😊" },
              { value: "FRIENDLY",     label: t("settings.friendly"),     emoji: "🤝" },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setTone(opt.value)}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${tone === opt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                <div className="text-xl mb-1">{opt.emoji}</div>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Google Review Link — also quick-save */}
          <h3 className="font-medium text-gray-900 text-sm mb-2 mt-4">{t("settings.googleConnection")}</h3>
          {loading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isGoogleConnected ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm text-gray-700">{isGoogleConnected ? t("settings.connected") : t("settings.notConnected")}</span>
                {!isGoogleConnected && (
                  <a href="/api/google/connect" className="ml-auto text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">{t("settings.connect")}</a>
                )}
                {isGoogleConnected && <span className="ml-auto text-xs text-green-600 font-medium">✓ Google Business</span>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Google Review Link
                  <span className="text-xs text-gray-400 ml-2">(customers sent here after 4-5★ rating)</span>
                </label>
                <input type="url" value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {googleReviewUrl && (
                  <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Test this link →</a>
                )}
              </div>
            </div>
          )}

          <button onClick={handleQuickSave}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            {quickSaved ? "✓ Saved" : t("settings.save")}
          </button>
        </div>

        {/* ── Website Widget ── */}
        {businessId && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Website Widget</h2>
            <p className="text-xs text-gray-400 mb-4">Embed your 5-star reviews on any website. Paste this code before &lt;/body&gt;.</p>
            <div className="relative">
              <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
{`<div id="starloop-widget"></div>
<script src="${typeof window !== "undefined" ? window.location.origin : "https://starloop.app"}/widget.js" data-business-id="${businessId}"></script>`}
              </pre>
              <button
                onClick={() => {
                  const code = `<div id="starloop-widget"></div>\n<script src="${window.location.origin}/widget.js" data-business-id="${businessId}"></script>`;
                  navigator.clipboard.writeText(code);
                  setWidgetCopied(true);
                  setTimeout(() => setWidgetCopied(false), 2000);
                }}
                className="absolute top-2 right-2 bg-white border border-gray-200 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {widgetCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
