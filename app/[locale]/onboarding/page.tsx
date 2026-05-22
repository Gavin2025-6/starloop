"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Logo from "@/components/ui/Logo";

const CATEGORIES = [
  "Cleaning", "Landscaping", "Restaurant", "Renovation",
  "Nail Salon", "Auto Repair", "Plumbing", "Electrical", "Moving", "Other",
];

export default function OnboardingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  // Redirect unauthenticated users
  if (status === "unauthenticated") {
    router.push(`/${locale}/auth/login`);
    return null;
  }

  if (status === "loading") {
    return (
      <div style={{
        background: "#0A0A0A",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ color: "#4F4F4F", fontSize: "0.875rem" }}>Loading…</div>
      </div>
    );
  }

  const userName = session?.user?.name?.split(" ")[0] ?? "there";

  async function handleSaveInfo() {
    if (!businessName) return;
    setSaving(true);
    await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: businessName, category }),
    });
    setSaving(false);
    setStep(2);
  }

  return (
    <div style={{
      background: "#0A0A0A",
      minHeight: "100vh",
      fontFamily: "var(--font-geist), -apple-system, sans-serif",
      color: "#FFFFFF",
    }}>
      {/* Top nav */}
      <div style={{ padding: "24px" }}>
        <Logo variant="dark" height={28} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: "512px", margin: "0 auto", padding: "48px 24px 48px" }}>

        {/* Progress indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "48px" }}>
          {[1, 2].map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && (
                <div style={{
                  flex: 1, height: "1px",
                  background: step > i ? "#FFFFFF" : "#1F1F1F",
                  transition: "background 0.3s",
                }} />
              )}
              <div style={{
                width: "24px", height: "24px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700,
                background: step >= s ? "#FFFFFF" : "transparent",
                color: step >= s ? "#0A0A0A" : "#4F4F4F",
                border: step >= s ? "none" : "1px solid #2F2F2F",
                transition: "all 0.3s",
                flexShrink: 0,
              }}>
                {s}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1, marginBottom: "16px" }}>
              Welcome, {userName}.
            </h1>
            <p style={{ color: "#6B7280", marginBottom: "40px", lineHeight: 1.6 }}>
              {t("onboarding.subtitle")}
            </p>

            {/* 3 feature previews */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
              {[
                { icon: "1", title: "Recover unhappy customers", desc: "Capture issues early and give owners a clear next step" },
                { icon: "2", title: "Reply with the right voice", desc: "Draft calm, specific replies for public reviews" },
                { icon: "3", title: "Track reputation signals", desc: "See requests, replies, feedback, and rating movement together" },
              ].map((item) => (
                <div key={item.title} style={{
                  display: "flex", alignItems: "flex-start", gap: "16px",
                  background: "#111111", border: "1px solid #1F1F1F",
                  borderRadius: "12px", padding: "20px",
                }}>
                  <div style={{
                    width: "40px", height: "40px", border: "1px solid #1F1F1F",
                    borderRadius: "8px", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "1.125rem", flexShrink: 0,
                    color: "#00C9A7",
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#FFFFFF", marginBottom: "4px" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6B7280" }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Business info form */}
            <div style={{
              background: "#111111", border: "1px solid #1F1F1F",
              borderRadius: "12px", padding: "24px",
              display: "flex", flexDirection: "column", gap: "16px",
              marginBottom: "24px",
            }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#FFFFFF", marginBottom: "12px" }}>
                  {t("onboarding.step1")}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#6B7280", marginBottom: "6px" }}>
                  {t("settings.businessName")}
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Wang's Cleaning Services"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "10px 12px",
                    background: "#0A0A0A", border: "1px solid #2F2F2F",
                    borderRadius: "8px", color: "#FFFFFF",
                    fontSize: "0.875rem", outline: "none",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#4F4F4F"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#2F2F2F"; }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#6B7280", marginBottom: "6px" }}>
                  {t("onboarding.businessCategory")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#0A0A0A", border: "1px solid #2F2F2F",
                    borderRadius: "8px", color: category ? "#FFFFFF" : "#4F4F4F",
                    fontSize: "0.875rem", outline: "none",
                    fontFamily: "inherit", cursor: "pointer",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#4F4F4F"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#2F2F2F"; }}
                >
                  <option value="" style={{ color: "#4F4F4F" }}>Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} style={{ color: "#FFFFFF", background: "#111111" }}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveInfo}
              disabled={!businessName || saving}
              style={{
                background: !businessName || saving ? "#1F1F1F" : "#FFFFFF",
                color: !businessName || saving ? "#4F4F4F" : "#0A0A0A",
                border: "none", borderRadius: "8px",
                padding: "14px 32px", fontSize: "0.875rem",
                fontWeight: 500, cursor: !businessName || saving ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (businessName && !saving) (e.currentTarget as HTMLElement).style.background = "#F0F0F0";
              }}
              onMouseLeave={(e) => {
                if (businessName && !saving) (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
              }}
            >
              {saving ? t("common.loading") : t("onboarding.continue") + " →"}
            </button>
          </div>
        )}

        {/* Step 2: Connect Google */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1, marginBottom: "16px" }}>
              Connect your Google Business.
            </h1>
            <p style={{ color: "#6B7280", marginBottom: "8px", lineHeight: 1.6 }}>
              {t("onboarding.step2")}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#4F4F4F", marginBottom: "40px" }}>
              This is required to use most features.
            </p>

            {/* Two options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {/* Option A: Has Google Business — connects via /api/google/connect */}
              <a
                href="/api/google/connect"
                style={{
                  background: "#111111", border: "1px solid #1F1F1F",
                  borderRadius: "12px", padding: "20px",
                  display: "flex", alignItems: "center", gap: "16px",
                  cursor: "pointer", textDecoration: "none", width: "100%",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2F2F2F"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F1F1F"; }}
              >
                <div style={{
                  width: "40px", height: "40px", borderRadius: "8px",
                  background: "#1A1A1A", border: "1px solid #2F2F2F",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {/* Google G */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#FFFFFF", marginBottom: "2px" }}>
                    {t("onboarding.connectGoogle")}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                    Connect and start syncing reviews
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F4F4F" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </a>

              {/* Option B: No Google Business */}
              <a
                href="https://business.google.com/create"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#111111", border: "1px solid #1F1F1F",
                  borderRadius: "12px", padding: "20px",
                  display: "flex", alignItems: "center", gap: "16px",
                  textDecoration: "none", transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2F2F2F"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F1F1F"; }}
              >
                <div style={{
                  width: "40px", height: "40px", borderRadius: "8px",
                  background: "#1A1A1A", border: "1px solid #2F2F2F",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#00C9A7", fontSize: "1.25rem", flexShrink: 0,
                }}>
                  +
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#FFFFFF", marginBottom: "2px" }}>
                    I don&apos;t have one yet
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                    Create a free Google Business Profile
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F4F4F" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </a>
            </div>

            {/* Skip link */}
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              style={{
                background: "none", border: "none",
                color: "#4F4F4F", fontSize: "0.875rem",
                cursor: "pointer", textDecoration: "underline",
                fontFamily: "inherit",
              }}
            >
              {t("onboarding.skipForNow")} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
