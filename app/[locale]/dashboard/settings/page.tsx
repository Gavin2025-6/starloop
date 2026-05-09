"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

const CATEGORIES = [
  "Cleaning", "Landscaping", "Restaurant", "Renovation", "Nail Salon",
  "Auto Repair", "Plumbing", "Electrical", "Moving", "Other",
];

export default function SettingsPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const googleParam = searchParams.get("google");

  const [businessName, setBusinessName]   = useState("");
  const [category, setCategory]           = useState("");
  const [tone, setTone]                   = useState("WARM");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [saved, setSaved]                 = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setBusinessName(data.name ?? "");
          setCategory(data.category ?? "");
          setTone(data.aiReplyTone ?? "WARM");
          setIsGoogleConnected(data.isGoogleConnected ?? false);
          setGoogleReviewUrl(data.googleReviewUrl ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (googleParam === "connected") setIsGoogleConnected(true);
  }, [googleParam]);

  async function handleSave() {
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: businessName,
        category,
        aiReplyTone: tone,
        googleReviewUrl: googleReviewUrl || null,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("settings.title")}
      </h1>

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

      <div className="space-y-6">
        {/* Business info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Business Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("settings.businessName")}
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("settings.businessCategory")}
              </label>
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
          <h2 className="font-semibold text-gray-900 mb-4">
            {t("settings.aiTone")}
          </h2>
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
          <h2 className="font-semibold text-gray-900 mb-4">
            {t("settings.googleConnection")}
          </h2>
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
                  <a
                    href="/api/google/connect"
                    className="ml-auto text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t("settings.connect")}
                  </a>
                )}
                {isGoogleConnected && (
                  <span className="ml-auto text-xs text-green-600 font-medium">✓ Google Business</span>
                )}
              </div>

              {/* Google Review URL */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Google Review Link
                  <span className="text-xs text-gray-400 ml-2">
                    (customers will be sent here after 4-5★ rating)
                  </span>
                </label>
                <input
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {googleReviewUrl && (
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Test this link →
                  </a>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Find your link:{" "}
                  <a
                    href="https://business.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    business.google.com
                  </a>
                  {" "}→ Your Business → Get more reviews → Copy link
                </p>
              </div>
            </div>
          )}
        </div>

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
