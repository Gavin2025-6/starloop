"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

const CATEGORIES = [
  "Cleaning", "Landscaping", "Restaurant", "Renovation", "Nail Salon",
  "Auto Repair", "Plumbing", "Electrical", "Moving", "Other",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div
        className="bg-white rounded-2xl p-6 w-full mx-4"
        style={{ maxWidth: "400px", boxShadow: "0 4px 24px rgba(74,111,255,0.15)" }}
      >
        <h3 className="text-base font-semibold mb-1" style={{ color: "#1A1D23" }}>Confirm your password</h3>
        <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Enter your current password to save these changes.</p>
        <input
          ref={inputRef}
          type="password"
          value={pwd}
          onChange={(e) => { setPwd(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); if (e.key === "Escape") onCancel(); }}
          placeholder="Current password"
          className="w-full px-3 py-2.5 text-sm mb-2"
          style={{
            border: "1px solid #E8ECEF",
            borderRadius: "8px",
            outline: "none",
            color: "#1A1D23",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
        />
        {error && <p className="text-xs mb-3" style={{ color: "#FF4757" }}>{error}</p>}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium transition-colors"
            style={{ border: "1px solid #E8ECEF", borderRadius: "10px", color: "#6B7280", background: "#fff", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={checking}
            className="flex-1 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
              borderRadius: "10px",
              color: "#fff",
              border: "none",
              cursor: checking ? "not-allowed" : "pointer",
            }}
          >
            {checking ? "Checking…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section header with purple accent ───────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-1 h-full rounded-full mt-1 self-stretch" style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", minHeight: "36px" }} />
      <div>
        <h2 className="font-semibold" style={{ color: "#1A1D23" }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const googleParam = searchParams.get("google");

  const [userName, setUserName]       = useState("");
  const [userEmail, setUserEmail]     = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug]               = useState("");
  const [slugError, setSlugError]     = useState("");
  const [category, setCategory]       = useState("");
  const [businessSaved, setBusinessSaved] = useState(false);
  const [businessError, setBusinessError] = useState("");

  const [tone, setTone]               = useState("WARM");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [quickSaved, setQuickSaved]   = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const [businessId, setBusinessId]   = useState("");
  const [widgetCopied, setWidgetCopied] = useState(false);

  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<"profile" | "business" | null>(null);

  const inputStyle = {
    border: "1px solid #E8ECEF",
    borderRadius: "8px",
    outline: "none",
    color: "#1A1D23",
    width: "100%",
  };

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

  }, []);

  useEffect(() => {
    if (googleParam === "connected") setIsGoogleConnected(true);
  }, [googleParam]);

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

  const cardStyle = {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #E8ECEF",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  return (
    <div className="max-w-2xl" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <PasswordModal
        open={modal !== null}
        onConfirm={async () => {
          setModal(null);
          if (modal === "profile") await doSaveProfile();
          if (modal === "business") await doSaveBusiness();
        }}
        onCancel={() => setModal(null)}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>{t("settings.title")}</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>Manage your business profile, Google review flow, and how StarLoop handles customer actions.</p>
      </div>

      {/* Banners */}
      {googleParam === "error" && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#FFF5F5", border: "1px solid #FFD0D0", color: "#FF4757" }}>
          Google授权失败，请重试。
        </div>
      )}
      {googleParam === "connected" && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(0,201,167,0.08)", border: "1px solid rgba(0,201,167,0.2)", color: "#00C9A7" }}>
          Google Business 已成功连接！
        </div>
      )}
      <div className="space-y-6">

        {/* ── Personal Profile ── */}
        <div style={cardStyle}>
          <SectionHeader title="Personal Profile" subtitle="Password required to save changes" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#1A1D23" }}>Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="px-3 py-2.5 text-sm"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#1A1D23" }}>Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="px-3 py-2.5 text-sm"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#1A1D23" }}>
                New Password <span className="text-xs" style={{ color: "#6B7280" }}>(leave blank to keep current)</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="px-3 py-2.5 text-sm"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            {profileError && <p className="text-xs" style={{ color: "#FF4757" }}>{profileError}</p>}
            <button
              onClick={() => setModal("profile")}
              className="px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", borderRadius: "10px", border: "none", cursor: "pointer" }}
            >
              {profileSaved ? "✓ Saved" : "Save Profile"}
            </button>
          </div>
        </div>

        {/* ── Business Profile ── */}
        <div style={cardStyle}>
          <SectionHeader title="Business Profile" subtitle="Password required to save changes" />
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#1A1D23" }}>{t("settings.businessName")}</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="px-3 py-2.5 text-sm"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#1A1D23" }}>
                Mini-Website URL slug
                <span className="text-xs ml-2" style={{ color: "#6B7280" }}>(your public review page)</span>
              </label>
              <div
                className="flex items-center overflow-hidden"
                style={{ border: "1px solid #E8ECEF", borderRadius: "8px" }}
                onFocusCapture={(e) => { e.currentTarget.style.borderColor = "#4A6FFF"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                onBlurCapture={(e) => { e.currentTarget.style.borderColor = "#E8ECEF"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <span className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ background: "#F8F9FC", borderRight: "1px solid #E8ECEF", color: "#6B7280" }}>
                  starloop.app/r/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugError(""); }}
                  placeholder="my-business-name"
                  className="flex-1 px-3 py-2.5 text-sm"
                  style={{ outline: "none", color: "#1A1D23" }}
                />
              </div>
              {slugError && <p className="text-xs mt-1" style={{ color: "#FF4757" }}>{slugError}</p>}
              {slug && !slugError && (
                <a href={`/r/${slug}`} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline mt-1 inline-block" style={{ color: "#4A6FFF" }}>
                  Preview page →
                </a>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#1A1D23" }}>{t("settings.businessCategory")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2.5 text-sm"
                style={{ ...inputStyle, appearance: "auto" }}
                onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {businessError && <p className="text-xs" style={{ color: "#FF4757" }}>{businessError}</p>}
            <button
              onClick={() => setModal("business")}
              className="px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", borderRadius: "10px", border: "none", cursor: "pointer" }}
            >
              {businessSaved ? "✓ Saved" : "Save Business"}
            </button>
          </div>
        </div>

        {/* ── Action Tone ── */}
        <div style={cardStyle}>
          <SectionHeader title="Customer Action Voice" subtitle="Saves instantly — this controls the tone for recovery actions and public responses" />
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { value: "PROFESSIONAL", label: "Professional", helper: "Clear and polished" },
              { value: "WARM",         label: "Warm", helper: "Caring and human" },
              { value: "FRIENDLY",     label: "Direct", helper: "Simple and action-focused" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTone(opt.value)}
                className="p-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  border: tone === opt.value ? "2px solid #4A6FFF" : "1px solid #E8ECEF",
                  background: tone === opt.value ? "rgba(74,111,255,0.06)" : "#fff",
                  color: tone === opt.value ? "#4A6FFF" : "#6B7280",
                  cursor: "pointer",
                }}
              >
                <div>{opt.label}</div>
                <div className="mt-1 text-xs font-normal" style={{ color: tone === opt.value ? "#4A6FFF" : "#8A94A8" }}>{opt.helper}</div>
              </button>
            ))}
          </div>

          <div className="pt-4" style={{ borderTop: "1px solid #F0F0F5" }}>
            <h3 className="font-medium text-sm mb-3" style={{ color: "#1A1D23" }}>{t("settings.googleConnection")}</h3>
            {loading ? (
              <div className="text-sm" style={{ color: "#6B7280" }}>Loading...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: isGoogleConnected ? "#00C9A7" : "#D1D5DB" }} />
                  <span className="text-sm" style={{ color: "#374151" }}>
                    {isGoogleConnected ? t("settings.connected") : t("settings.notConnected")}
                  </span>
                  {!isGoogleConnected && (
                    <a
                      href="/api/google/connect"
                      className="ml-auto text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
                      style={{ border: "1px solid #E8ECEF", color: "#6B7280", background: "#fff" }}
                    >
                      {t("settings.connect")}
                    </a>
                  )}
                  {isGoogleConnected && (
                    <span className="ml-auto text-xs font-medium" style={{ color: "#00C9A7" }}>✓ Google Business</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#1A1D23" }}>
                    Google Review Link
                    <span className="text-xs ml-2" style={{ color: "#6B7280" }}>(shown as a public review option)</span>
                  </label>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="px-3 py-2.5 text-sm"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                  />
                  {googleReviewUrl && (
                    <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline mt-1 inline-block" style={{ color: "#4A6FFF" }}>
                      Test this link →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleQuickSave}
            className="mt-5 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", borderRadius: "10px", border: "none", cursor: "pointer" }}
          >
            {quickSaved ? "✓ Saved" : t("settings.save")}
          </button>
        </div>

        {/* ── Website Widget ── */}
        {businessId && (
          <div style={cardStyle}>
            <SectionHeader title="Website Widget" subtitle="Embed your 5-star reviews on any website. Paste this code before </body>." />
            <div className="relative">
              <pre
                className="rounded-xl p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all"
                style={{ background: "#F8F9FC", border: "1px solid #E8ECEF", color: "#374151" }}
              >
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
                className="absolute top-2 right-2 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
                style={{ background: "#fff", border: "1px solid #E8ECEF", color: "#6B7280", cursor: "pointer" }}
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
