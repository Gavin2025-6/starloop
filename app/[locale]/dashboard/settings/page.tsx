"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const CATEGORIES = [
  "Cleaning",
  "Landscaping",
  "Restaurant",
  "Renovation",
  "Nail Salon",
  "Auto Repair",
  "Plumbing",
  "Electrical",
  "Moving",
  "Other",
];

export default function SettingsPage() {
  const t = useTranslations();
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("WARM");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: businessName, category, aiReplyTone: tone }),
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

      <div className="space-y-6">
        {/* Business info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {t("settings.businessName")}
          </h2>
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
                  <option key={c} value={c}>
                    {c}
                  </option>
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
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-sm text-gray-500">
              {t("settings.notConnected")}
            </span>
            <a
              href="/api/google/connect"
              className="ml-auto text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("settings.connect")}
            </a>
          </div>
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
