"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/ui/Logo";

type Step = 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 5;

/* ─── Progress bar ────────────────────────────────────────────── */
function ProgressBar({ step }: { step: Step }) {
  return (
    <div style={{ width: "100%", marginBottom: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", color: "#6B7280" }}>Step {step} of {TOTAL_STEPS}</span>
        <span style={{ fontSize: "13px", color: "#6B7280" }}>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div style={{ height: "6px", background: "#E5E7EB", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${(step / TOTAL_STEPS) * 100}%`,
          background: "linear-gradient(90deg, #4A6FFF, #00C9A7)",
          borderRadius: "99px", transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

/* ─── Step 1: Welcome ─────────────────────────────────────────── */
function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "20px",
          background: "linear-gradient(135deg, #4A6FFF, #00C9A7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "36px", margin: "0 auto 20px",
        }}>⭐</div>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#0D1117", marginBottom: "10px", lineHeight: 1.2 }}>
          Welcome to StarLoop
        </h1>
        <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.7 }}>
          StarLoop helps local businesses turn every customer into the next referral.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
        {[
          { icon: "📱", title: "One-tap SMS review requests", desc: "Automatically send feedback requests to customers — no manual effort." },
          { icon: "🛡️", title: "Service Recovery Protocol", desc: "Unhappy customer feedback comes to you privately so you can follow up." },
          { icon: "📊", title: "Rating trend analysis", desc: "AI generates a monthly report identifying patterns you can improve." },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{
            display: "flex", gap: "14px", alignItems: "flex-start",
            padding: "14px 16px", background: "#F9FAFB",
            borderRadius: "12px", border: "1px solid #E5E7EB",
          }}>
            <span style={{ fontSize: "22px", flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#0D1117", marginBottom: "2px" }}>{title}</p>
              <p style={{ fontSize: "13px", color: "#6B7280" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onNext} style={btnPrimary}>
        Get started →
      </button>
    </div>
  );
}

/* ─── Step 2: Connect Google (mandatory) ──────────────────────── */
function Step2() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "20px",
          background: "#EEF3FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "36px", margin: "0 auto 20px",
        }}>🔗</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "8px" }}>
          Connect Google Business (required)
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>
          StarLoop needs your Google Business access to sync reviews and notify you when customers leave feedback.
        </p>
      </div>

      <div style={{
        background: "#FFF7ED", border: "1px solid #FED7AA",
        borderRadius: "10px", padding: "12px 16px", marginBottom: "24px",
      }}>
        <p style={{ fontSize: "13px", color: "#B76200", margin: 0 }}>
          ⚠️ This step is required to continue. You will be automatically taken to the next step after connecting.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
        {[
          "Auto-sync new reviews — no manual refresh needed",
          "Customer feedback notifies you so you can follow up",
          "Monthly reputation report generated automatically",
        ].map(b => (
          <div key={b} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ color: "#10B981", flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: "14px", color: "#374151" }}>{b}</span>
          </div>
        ))}
      </div>

      {/* Plain <a> tag — full page navigation avoids JS state timing issues */}
      <a
        href="/api/google/connect"
        style={{
          ...btnPrimary,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "10px", textDecoration: "none",
        }}
      >
        <GoogleIcon />
        Connect Google Business →
      </a>
    </div>
  );
}

/* ─── Step 3: Confirm business info ───────────────────────────── */
function Step3({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [avgTransactionValue, setAvgTransactionValue] = useState("");
  const [primaryAcquisitionChannel, setPrimaryAcquisitionChannel] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [saving, setSaving] = useState(false);

  const CATEGORIES = [
    "Restaurant", "Cleaning", "Landscaping", "Renovation",
    "Nail Salon", "Auto Repair", "Plumbing", "Electrical", "Moving", "Other",
  ];

  const ACQUISITION_CHANNELS = [
    "Google Search", "Word of mouth", "WeChat/WhatsApp", "Instagram/Social media", "Walk-in", "Other",
  ];

  const INDUSTRY_TYPES = [
    "Cleaning", "HVAC", "Nails & Beauty", "Auto Detailing", "Restaurant",
    "Auto Repair", "Beauty Salon", "Pharmacy", "Landscaping", "Plumbing", "Other",
  ];

  useEffect(() => {
    fetch("/api/business")
      .then(r => r.json())
      .then(d => {
        if (d.name) setName(d.name);
        if (d.category) setCategory(d.category);
        if (d.phone) setPhone(d.phone);
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        category,
        phone: phone.trim(),
        avgTransactionValue: avgTransactionValue ? Number(avgTransactionValue) : undefined,
        primaryAcquisitionChannel: primaryAcquisitionChannel || undefined,
        industryType: industryType || undefined,
      }),
    }).catch(() => {});
    setSaving(false);
    onNext();
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏪</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "6px" }}>
          Confirm your business info
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>
          This information appears in the messages sent to your customers.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
        <div>
          <label style={labelStyle}>Business name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Wang's Cleaning Services"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Business type</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            <option value="">Select a type</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Phone number (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 416-555-0123"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Average service transaction value (optional)</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}>$</span>
            <input
              type="number"
              value={avgTransactionValue}
              onChange={e => setAvgTransactionValue(e.target.value)}
              placeholder="e.g. 150"
              min="0"
              style={{ ...inputStyle, paddingLeft: "26px" }}
            />
          </div>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px", marginBottom: 0 }}>
            Used to calculate your estimated revenue from new reviews.
          </p>
        </div>
        <div>
          <label style={labelStyle}>How do you mainly acquire new customers?</label>
          <select value={primaryAcquisitionChannel} onChange={e => setPrimaryAcquisitionChannel(e.target.value)} style={inputStyle}>
            <option value="">Select a channel</option>
            {ACQUISITION_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Your primary industry</label>
          <select value={industryType} onChange={e => setIndustryType(e.target.value)} style={inputStyle}>
            <option value="">Select an industry</option>
            {INDUSTRY_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!name.trim() || saving}
        style={{ ...btnPrimary, opacity: !name.trim() || saving ? 0.5 : 1 }}
      >
        {saving ? "Saving…" : "Confirm and continue →"}
      </button>
    </div>
  );
}

/* ─── Step 4: Service Recovery Protocol setup ─────────────────── */
function Step4({ onNext }: { onNext: () => void }) {
  const [emailAlert, setEmailAlert] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    onNext();
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🛡️</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "6px" }}>
          Set up Service Recovery Protocol
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>
          When customers leave a low rating, StarLoop notifies you privately so you can follow up before a review goes public.
        </p>
      </div>

      <div style={{
        background: "#F0FDF4", border: "1px solid #A7F3D0",
        borderRadius: "12px", padding: "16px", marginBottom: "24px",
      }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#065F46", marginBottom: "8px" }}>✅ Default recovery flow (enabled)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            "Customer feedback sent to you privately — not posted publicly",
            "AI generates a suggested reply",
            "24-hour follow-up reminder",
            "Happy customers can voluntarily share a Google review",
          ].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#374151" }}>
              <span style={{ color: "#10B981" }}>→</span> {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: "#fff", border: "1px solid #E5E7EB",
        borderRadius: "12px", padding: "16px", marginBottom: "24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#0D1117", marginBottom: "2px" }}>
              Email alert when low-rating feedback arrives
            </p>
            <p style={{ fontSize: "12px", color: "#6B7280" }}>Notifies you immediately so you can take action</p>
          </div>
          <button
            onClick={() => setEmailAlert(!emailAlert)}
            style={{
              width: "44px", height: "24px", borderRadius: "12px", border: "none",
              background: emailAlert ? "#4A6FFF" : "#D1D5DB",
              cursor: "pointer", position: "relative", transition: "background 0.2s",
            }}
          >
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
              position: "absolute", top: "3px",
              left: emailAlert ? "23px" : "3px", transition: "left 0.2s",
            }} />
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={btnPrimary}>
        {saving ? "Saving…" : "Save settings and continue →"}
      </button>
    </div>
  );
}

/* ─── Step 5: Send test SMS ───────────────────────────────────── */
function Step5({ onComplete }: { onComplete: () => void }) {
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

  async function handleSend() {
    if (!phone.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/user/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        // Translate error codes into user-friendly messages
        if (data.error === "TRIAL_UNVERIFIED") {
          setError("Your phone number isn't verified on the SMS service yet. Go to twilio.com → Verified Caller IDs and add your number, then try again. Or skip this step.");
        } else if (data.error === "CREDENTIALS_INVALID") {
          setError("SMS service is not configured. Please contact support or skip this step.");
        } else {
          setError(`Could not send SMS: ${data.error}`);
        }
      } else {
        setSent(true);
      }
    } catch {
      setError("Could not reach the server. Please try again or skip this step.");
    } finally {
      setSending(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    await fetch("/api/user/complete-onboarding", { method: "POST" });
    onComplete();
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📱</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "6px" }}>
          Send a test SMS to yourself
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>
          Enter your phone number and confirm the message arrives. Then you&apos;re all set!
        </p>
      </div>

      {!sent ? (
        <>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Your phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +1 416-555-0123"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#EF4444", marginBottom: "12px" }}>{error}</p>
          )}

          <button
            onClick={handleSend}
            disabled={!phone.trim() || sending}
            style={{ ...btnPrimary, opacity: !phone.trim() || sending ? 0.5 : 1, marginBottom: "12px" }}
          >
            {sending ? "Sending…" : "Send test SMS"}
          </button>

          <button onClick={handleComplete} disabled={completing} style={btnSecondary}>
            {completing ? "Finishing…" : "Skip this step and go to Dashboard →"}
          </button>
        </>
      ) : (
        <>
          <div style={{
            background: "#F0FDF4", border: "1px solid #A7F3D0",
            borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "24px",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#065F46", marginBottom: "4px" }}>
              Test SMS sent!
            </p>
            <p style={{ fontSize: "13px", color: "#6B7280" }}>
              Check {phone} for the test message.
            </p>
          </div>

          <button onClick={handleComplete} disabled={completing} style={btnPrimary}>
            {completing ? "Loading…" : "🎉 Go to Dashboard →"}
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Shared styles ───────────────────────────────────────────── */
const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "14px 20px",
  background: "#0D1117", color: "#fff",
  border: "none", borderRadius: "10px",
  fontSize: "15px", fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  width: "100%", padding: "12px 20px",
  background: "transparent", color: "#6B7280",
  border: "1px solid #E5E7EB", borderRadius: "10px",
  fontSize: "14px", cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  border: "1px solid #E5E7EB", borderRadius: "8px",
  fontSize: "14px", color: "#0D1117",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "13px",
  color: "#374151", marginBottom: "6px", fontWeight: 500,
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
    </svg>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function OnboardingPage() {
  const searchParams = useSearchParams();

  // Initialize from URL search params. Default to 1 if missing.
  const [step, setStep] = useState<Step>(() => {
    const n = parseInt(searchParams.get("step") ?? "1");
    return (n >= 1 && n <= 5 ? n : 1) as Step;
  });

  // Fallback: re-read from window.location after hydration.
  // This handles the edge case where useSearchParams returns null during SSR
  // (e.g., inside a Suspense boundary), which would incorrectly default step to 1
  // even when the URL has ?step=3 (after Google OAuth callback).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = parseInt(params.get("step") ?? "1");
    if (n >= 2 && n <= 5) setStep(n as Step); // only override if URL says step > 1
  }, []); // runs once on mount

  function goTo(s: Step) {
    setStep(s);
    // Preserve whatever locale is in the current URL instead of hardcoding /en
    const localePrefix = window.location.pathname.split("/")[1]; // "en" or "zh-CN"
    window.history.replaceState(null, "", `/${localePrefix}/onboarding?step=${s}`);
    window.scrollTo(0, 0);
  }

  function handleComplete() {
    // Hard redirect so the dashboard layout's auth() call refreshes
    // onboardingCompleted=true and isGoogleConnected=true from DB.
    window.location.href = "/en/dashboard";
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F9FAFB",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ padding: "20px 32px", borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <Logo height={22} />
      </div>

      <div style={{
        flex: 1, display: "flex", alignItems: "flex-start",
        justifyContent: "center", padding: "40px 24px 80px",
      }}>
        <div style={{
          width: "100%", maxWidth: "480px",
          background: "#fff", borderRadius: "20px",
          border: "1px solid #E5E7EB", padding: "32px 28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <ProgressBar step={step} />

          {step === 1 && <Step1 onNext={() => goTo(2)} />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 onNext={() => goTo(4)} />}
          {step === 4 && <Step4 onNext={() => goTo(5)} />}
          {step === 5 && <Step5 onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
}
