"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface GoogleConnectStepProps {
  locale: string;
}

export default function GoogleConnectStep({ locale }: GoogleConnectStepProps) {
  const t = useTranslations();
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [step, setStep] = useState<"info" | "connect">("info");
  const [saving, setSaving] = useState(false);

  const CATEGORIES = [
    "Cleaning", "Landscaping", "Restaurant", "Renovation",
    "Nail Salon", "Auto Repair", "Plumbing", "Electrical", "Moving", "Other",
  ];

  async function handleSaveInfo() {
    if (!businessName) return;
    setSaving(true);
    await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: businessName, category }),
    });
    setSaving(false);
    setStep("connect");
  }

  if (step === "info") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 mb-1">
            {t("onboarding.step1")}
          </h2>
          <p className="text-sm text-gray-500">{t("onboarding.businessName")}</p>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            {t("settings.businessName")}
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Wang's Cleaning Services"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            {t("onboarding.businessCategory")}
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

        <button
          onClick={handleSaveInfo}
          disabled={!businessName || saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? t("common.loading") : t("onboarding.continue")}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900 mb-1">
          {t("onboarding.step2")}
        </h2>
        <p className="text-sm text-gray-500">
          Connect your Google Business Profile to start syncing reviews.
        </p>
      </div>

      <a
        href="/api/google/connect"
        className="flex items-center justify-center gap-3 w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
          <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
          <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
          <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
        </svg>
        {t("onboarding.connectGoogle")}
      </a>

      <button
        onClick={() => router.push(`/${locale}/dashboard`)}
        className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
      >
        {t("onboarding.skipForNow")} →
      </button>
    </div>
  );
}
