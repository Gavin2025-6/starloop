"use client";

import { useState, useEffect } from "react";
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
    priceIdEnv: "STRIPE_STARTER_PRICE_ID",
  },
  {
    key: "PRO",
    name: "Pro",
    price: "$79/mo",
    features: ["Everything in Starter", "Up to 5 locations", "Analytics & reporting", "Priority support"],
    color: "border-purple-500",
    badge: "bg-purple-100 text-purple-700",
    priceIdEnv: "STRIPE_PRO_PRICE_ID",
  },
];

export default function SettingsPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const googleParam = searchParams.get("google");
  const paymentParam = searchParams.get("payment");

  const [businessName, setBusinessName]   = useState("");
  const [slug, setSlug]                   = useState("");
  const [slugError, setSlugError]         = useState("");
  const [category, setCategory]           = useState("");
  const [tone, setTone]                   = useState("WARM");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [saved, setSaved]                 = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [loading, setLoading]             = useState(true);
  const [currentPlan, setCurrentPlan]     = useState("FREE");
  const [upgrading, setUpgrading]         = useState<string | null>(null);
  const [widgetCopied, setWidgetCopied]   = useState(false);
  const [businessId, setBusinessId]       = useState("");

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setBusinessName(data.name ?? "");
          setSlug(data.slug ?? "");
          setCategory(data.category ?? "");
          setTone(data.aiReplyTone ?? "WARM");
          setIsGoogleConnected(data.isGoogleConnected ?? false);
          setGoogleReviewUrl(data.googleReviewUrl ?? "");
          setBusinessId(data.id ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((data) => setCurrentPlan(data.plan ?? "FREE"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (googleParam === "connected") setIsGoogleConnected(true);
  }, [googleParam]);

  async function handleSave() {
    setSlugError("");
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: businessName, slug: cleanSlug || null, category, aiReplyTone: tone, googleReviewUrl: googleReviewUrl || null }),
    });
    if (res.status === 409) { setSlugError("This URL slug is already taken. Choose another."); return; }
    if (res.ok) { setSlug(cleanSlug); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  async function handleUpgrade(planKey: string) {
    setUpgrading(planKey);
    try {
      // If already subscribed, go to portal
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("settings.title")}</h1>

      {googleParam === "error" && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          Google 授权失败，请重试。
        </div>
      )}
      {googleParam === "connected" && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          Google Business 已成功连接！
        </div>
      )}
      {paymentParam === "success" && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          🎉 Payment successful! Your plan has been upgraded.
        </div>
      )}
      {paymentParam === "cancelled" && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
          Payment cancelled. Your plan was not changed.
        </div>
      )}

      <div className="space-y-6">
        {/* Subscription Plans */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Subscription Plan</h2>
          <p className="text-xs text-gray-400 mb-4">
            Current plan: <span className="font-semibold text-gray-700">{currentPlan}</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.key;
              return (
                <div
                  key={plan.key}
                  className={`rounded-xl border-2 p-4 ${isCurrent ? plan.color : "border-gray-100"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
                    {isCurrent && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.badge}`}>
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-3">{plan.price}</div>
                  <ul className="space-y-1 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs text-gray-500 flex gap-1">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && plan.key !== "FREE" && (
                    <button
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={upgrading === plan.key}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                        plan.key === "PRO"
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {upgrading === plan.key ? "..." : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                  {isCurrent && plan.key !== "FREE" && (
                    <button
                      onClick={() => handleUpgrade(plan.key)}
                      className="w-full py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Manage Billing
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Business info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Business Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("settings.businessName")}</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Mini-Website URL slug
                <span className="text-xs text-gray-400 ml-2">(your public review page)</span>
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="bg-gray-50 border-r border-gray-300 px-3 py-2 text-xs text-gray-400 whitespace-nowrap">starloop.app/r/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugError(""); }}
                  placeholder="my-business-name"
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
              {slug && !slugError && (
                <div className="flex items-center gap-2 mt-1">
                  <a href={`/r/${slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    Preview page →
                  </a>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("settings.businessCategory")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* AI Tone */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t("settings.aiTone")}</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "PROFESSIONAL", label: t("settings.professional"), emoji: "👔" },
              { value: "WARM",         label: t("settings.warm"),         emoji: "😊" },
              { value: "FRIENDLY",     label: t("settings.friendly"),     emoji: "🤝" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTone(option.value)}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  tone === option.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="text-xl mb-1">{option.emoji}</div>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Google connection */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{t("settings.googleConnection")}</h2>
          {loading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isGoogleConnected ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-sm text-gray-700">
                  {isGoogleConnected ? t("settings.connected") : t("settings.notConnected")}
                </span>
                {!isGoogleConnected && (
                  <a href="/api/google/connect" className="ml-auto text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    {t("settings.connect")}
                  </a>
                )}
                {isGoogleConnected && (
                  <span className="ml-auto text-xs text-green-600 font-medium">✓ Google Business</span>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Google Review Link
                  <span className="text-xs text-gray-400 ml-2">(customers will be sent here after 4-5★ rating)</span>
                </label>
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {googleReviewUrl && (
                  <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                    Test this link →
                  </a>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Find your link:{" "}
                  <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    business.google.com
                  </a>
                  {" "}→ Your Business → Get more reviews → Copy link
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Website Widget */}
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

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          {saved ? t("settings.saved") : t("settings.save")}
        </button>
      </div>
    </div>
  );
}
