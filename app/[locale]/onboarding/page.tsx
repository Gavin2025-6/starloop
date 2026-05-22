"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Logo from "@/components/ui/Logo";

const CATEGORIES = [
  "Dentist", "HVAC", "Property Management", "Auto Dealer",
  "Spa", "Law Firm", "Cleaning", "Landscaping", "Restaurant", "Other",
];

const totalSteps = 4;

export default function OnboardingPage() {
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [fading, setFading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLater, setShowLater] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (step === 4 && !completed) {
      setCompleted(true);
      fetch("/api/user/onboarding-complete", { method: "PATCH" }).catch(() => {});
    }
  }, [step, completed]);

  function goToStep(next: number) {
    setFading(true);
    setTimeout(() => { setStep(next); setFading(false); }, 150);
  }

  if (status === "unauthenticated") {
    router.push(`/${locale}/auth/login`);
    return null;
  }

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ color: "#AAA", fontSize: "0.875rem" }}>Loading…</div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  async function handleSaveInfo() {
    if (!businessName) return;
    setSaving(true);
    await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: businessName, category }),
    });
    setSaving(false);
    goToStep(4);
  }

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    boxSizing: "border-box",
    height: "44px",
    padding: "0 14px",
    fontSize: "0.9375rem",
    color: "#000",
    background: "#fff",
    border: `1px solid ${focused === name ? "#000" : "#E5E5E5"}`,
    borderRadius: "6px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxShadow: focused === name ? "0 0 0 3px rgba(0,0,0,0.06)" : "none",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 32px", borderBottom: "1px solid #F0F0F0",
      }}>
        <Logo height={24} />
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          style={{
            background: "none", border: "none",
            fontSize: "0.8125rem", color: "#999",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Skip for now
        </button>
      </div>

      {/* Thin progress bar */}
      <div style={{
        height: "2px",
        background: "#F0F0F0",
        flexShrink: 0,
        position: "relative",
      }}>
        <div style={{
          height: "100%",
          width: `${(step / totalSteps) * 100}%`,
          background: "#000",
          transition: "width 0.4s ease",
        }}/>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px 80px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "480px",
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.15s, transform 0.15s",
        }}>
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div>
              <p style={{
                fontSize: "0.75rem", fontWeight: 500, color: "#999",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px",
              }}>
                Welcome
              </p>
              <h1 style={{
                fontSize: "2.5rem", fontWeight: 700, color: "#000",
                lineHeight: 1.12, letterSpacing: "-0.03em", marginBottom: "12px",
              }}>
                Welcome to StarLoop, {firstName}
              </h1>
              <p style={{ fontSize: "1rem", color: "#888", lineHeight: 1.6, marginBottom: "48px" }}>
                You&apos;re 3 minutes away from your first review request.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "48px" }}>
                {[
                  "Catch unhappy customers before they post",
                  "Ask happy customers for Google reviews automatically",
                  "See what's hurting your rating every week",
                ].map((text) => (
                  <div key={text} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: "0.9375rem", color: "#444" }}>{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => goToStep(2)}
                style={{
                  width: "100%", height: "48px",
                  background: "#000", color: "#fff",
                  border: "none", borderRadius: "6px",
                  fontSize: "0.9375rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                Let&apos;s get started →
              </button>
            </div>
          )}

          {/* Step 2: Connect Google */}
          {step === 2 && (
            <div>
              <p style={{
                fontSize: "0.75rem", fontWeight: 500, color: "#999",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px",
              }}>
                Connect
              </p>
              <h1 style={{
                fontSize: "2rem", fontWeight: 700, color: "#000",
                lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: "12px",
              }}>
                Connect your Google Business Profile
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "#888", lineHeight: 1.6, marginBottom: "40px" }}>
                This lets StarLoop watch for new reviews and sync your rating automatically.
              </p>

              <div style={{
                border: "1px solid #E5E5E5",
                borderRadius: "8px", padding: "24px",
                marginBottom: "28px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="200" height="64" viewBox="0 0 200 64" fill="none">
                  <rect x="20" y="12" width="40" height="40" rx="20" stroke="#E5E5E5" strokeWidth="1.5"/>
                  <text x="40" y="37" textAnchor="middle" fill="#333" fontSize="16" fontWeight="600">G</text>
                  <line x1="64" y1="32" x2="126" y2="32" stroke="#CCC" strokeWidth="1.5" strokeDasharray="4,3">
                    <animate attributeName="stroke-dashoffset" from="14" to="0" dur="1.5s" repeatCount="indefinite"/>
                  </line>
                  <rect x="140" y="12" width="40" height="40" rx="20" stroke="#E5E5E5" strokeWidth="1.5"/>
                  <text x="160" y="38" textAnchor="middle" fill="#333" fontSize="18" fontWeight="700">∞</text>
                </svg>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                {[
                  "See new reviews the moment they arrive",
                  "Auto-sync your Google rating",
                  "Enable one-click review requests",
                ].map((text) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: "0.875rem", color: "#555" }}>{text}</span>
                  </div>
                ))}
              </div>

              <a
                href="/api/google/connect"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", height: "48px",
                  background: "#000", color: "#fff",
                  border: "none", borderRadius: "6px",
                  fontSize: "0.9375rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  textDecoration: "none",
                  marginBottom: "20px",
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                Connect Google Business →
              </a>

              {!showLater ? (
                <button
                  onClick={() => setShowLater(true)}
                  style={{
                    background: "none", border: "none",
                    color: "#999", fontSize: "0.8125rem",
                    cursor: "pointer", fontFamily: "inherit",
                    display: "block", margin: "0 auto",
                  }}
                >
                  I&apos;ll do this later
                </button>
              ) : (
                <div style={{
                  border: "1px solid #F0F0F0",
                  borderRadius: "6px", padding: "16px 20px",
                }}>
                  <p style={{ color: "#888", fontSize: "0.8125rem", marginBottom: "12px", lineHeight: 1.5 }}>
                    No worries! You can connect anytime in Settings. Some features won&apos;t work until then.
                  </p>
                  <button
                    onClick={() => goToStep(3)}
                    style={{
                      background: "#000", color: "#fff",
                      border: "none", borderRadius: "6px",
                      padding: "8px 18px", fontSize: "0.8125rem",
                      fontWeight: 500, cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "transform 0.1s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    Continue →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Business Setup */}
          {step === 3 && (
            <div>
              <p style={{
                fontSize: "0.75rem", fontWeight: 500, color: "#999",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px",
              }}>
                Business info
              </p>
              <h1 style={{
                fontSize: "2rem", fontWeight: 700, color: "#000",
                lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: "12px",
              }}>
                Tell us about your business
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "#888", lineHeight: 1.6, marginBottom: "40px" }}>
                This helps StarLoop tailor your experience.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
                <div>
                  <label style={{
                    display: "block", fontSize: "0.75rem", fontWeight: 500,
                    color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    Business name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    placeholder="Bright Dental Toronto"
                    style={inputStyle("name")}
                  />
                </div>
                <div>
                  <label style={{
                    display: "block", fontSize: "0.75rem", fontWeight: 500,
                    color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    onFocus={() => setFocused("category")}
                    onBlur={() => setFocused(null)}
                    style={{ ...inputStyle("category"), appearance: "none", cursor: "pointer", color: category ? "#000" : "#999", backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\"><path d=\"M3 5l3 3 3-3\" stroke=\"%23999\" stroke-width=\"1.5\" fill=\"none\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveInfo}
                disabled={!businessName || saving}
                style={{
                  width: "100%", height: "48px",
                  background: "#000", color: "#fff",
                  border: "none", borderRadius: "6px",
                  fontSize: "0.9375rem", fontWeight: 600,
                  cursor: !businessName || saving ? "not-allowed" : "pointer",
                  opacity: !businessName || saving ? 0.4 : 1,
                  fontFamily: "inherit",
                  transition: "transform 0.1s, opacity 0.15s",
                }}
                onMouseEnter={(e) => { if (businessName && !saving) e.currentTarget.style.transform = "scale(1.01)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {saving ? "Saving…" : "Continue →"}
              </button>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontSize: "0.75rem", fontWeight: 500, color: "#999",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "32px",
              }}>
                Ready
              </p>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "#F5F5F5",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 style={{
                fontSize: "2rem", fontWeight: 700, color: "#000",
                lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: "12px",
              }}>
                You&apos;re all set
              </h1>
              <p style={{ color: "#888", marginBottom: "40px", lineHeight: 1.6, fontSize: "0.9375rem" }}>
                Maya is ready to help you get started.
              </p>
              <button
                onClick={() => router.push(`/${locale}/dashboard/requests`)}
                style={{
                  width: "100%", height: "48px",
                  background: "#000", color: "#fff",
                  border: "none", borderRadius: "6px",
                  fontSize: "0.9375rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.01)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                Send first request →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
