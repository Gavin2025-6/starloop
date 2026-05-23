"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

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
  const [googleDisconnecting, setGoogleDisconnecting] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const [businessId, setBusinessId]   = useState("");
  const [widgetCopied, setWidgetCopied] = useState(false);
  const [reviewPageCopied, setReviewPageCopied] = useState(false);

  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<"profile" | "business" | null>(null);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (!deletePassword) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete account");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleting(false);
    }
  }

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

  async function handleGoogleDisconnect() {
    setGoogleDisconnecting(true);
    setGoogleError("");
    try {
      const res = await fetch("/api/google/disconnect", { method: "DELETE" });
      if (!res.ok) {
        setGoogleError("Could not disconnect Google Business. Please try again.");
        return;
      }
      setIsGoogleConnected(false);
    } catch {
      setGoogleError("Network error. Please try again.");
    } finally {
      setGoogleDisconnecting(false);
    }
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
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>Settings</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>Manage your business profile, Google review flow, and how StarLoop handles customer actions.</p>
      </div>

      {/* Banners */}
      {googleParam === "error" && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#FFF5F5", border: "1px solid #FFD0D0", color: "#FF4757" }}>
          Google authorization failed. Please try again.
        </div>
      )}
      {googleParam === "connected" && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(0,201,167,0.08)", border: "1px solid rgba(0,201,167,0.2)", color: "#00C9A7" }}>
          Google Business connected successfully.
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
              <label className="block text-sm mb-1.5" style={{ color: "#1A1D23" }}>Business Name</label>
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
              <label className="block text-sm mb-1.5" style={{ color: "#1A1D23" }}>Business Category</label>
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
            <h3 className="font-medium text-sm mb-3" style={{ color: "#1A1D23" }}>Google Business</h3>
            {loading ? (
              <div className="text-sm" style={{ color: "#6B7280" }}>Loading...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: "#F8F9FC", border: "1px solid #E8ECEF" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: isGoogleConnected ? "#00C9A7" : "#EF4444", boxShadow: isGoogleConnected ? "0 0 0 3px rgba(0,201,167,0.12)" : "0 0 0 3px rgba(239,68,68,0.12)" }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1A1D23" }}>
                        {isGoogleConnected ? (businessName || "Google Business") : "Google Business"}
                      </p>
                      <p className="text-xs" style={{ color: isGoogleConnected ? "#087C6D" : "#EF4444" }}>
                        {isGoogleConnected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  {isGoogleConnected ? (
                    <button
                      onClick={handleGoogleDisconnect}
                      disabled={googleDisconnecting}
                      className="rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #FCA5A5",
                        color: "#EF4444",
                        cursor: googleDisconnecting ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
                    >
                      {googleDisconnecting ? "Disconnecting..." : "Disconnect"}
                    </button>
                  ) : (
                    <a
                      href="/api/google/connect"
                      className="rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-gray-100"
                      style={{ border: "1px solid #E8ECEF", color: "#374151", background: "#FFFFFF", whiteSpace: "nowrap" }}
                    >
                      Connect
                    </a>
                  )}
                </div>
                {googleError && <p className="text-xs" style={{ color: "#EF4444" }}>{googleError}</p>}
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
            {quickSaved ? "✓ Saved" : "Save"}
          </button>
        </div>

        {/* ── Public Review Page ── */}
        {slug && (
          <div style={cardStyle}>
            <SectionHeader title="Your Public Review Page" subtitle="Share this link anywhere — SMS, Google profile, business cards" />
            <div style={{
              background: "#F8F9FC", border: "1px solid #E8ECEF",
              borderRadius: "10px", padding: "12px 16px",
              display: "flex", alignItems: "center", gap: "12px",
              marginBottom: "12px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span style={{ flex: 1, fontSize: "0.875rem", color: "#374151", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                starloop.app/r/{slug}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://starloop.app/r/${slug}`);
                  setReviewPageCopied(true);
                  setTimeout(() => setReviewPageCopied(false), 2000);
                }}
                style={{
                  background: "#fff", border: "1px solid #E8ECEF", borderRadius: "6px",
                  padding: "4px 10px", fontSize: "0.75rem", color: "#374151", cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {reviewPageCopied ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={`/r/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#fff", border: "1px solid #E8ECEF", borderRadius: "6px",
                  padding: "4px 10px", fontSize: "0.75rem", color: "#4A6FFF", textDecoration: "none", whiteSpace: "nowrap",
                }}
              >
                Preview →
              </a>
            </div>
            <details style={{ fontSize: "0.8125rem" }}>
              <summary style={{ color: "#6B7280", cursor: "pointer", userSelect: "none" }}>
                For developers only
              </summary>
              <div style={{ marginTop: "12px", position: "relative" }}>
                <pre style={{
                  background: "#F8F9FC", border: "1px solid #E8ECEF",
                  borderRadius: "10px", padding: "16px", overflowX: "auto",
                  fontSize: "0.75rem", color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>
{`<div id="starloop-widget"></div>
<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-business-id="${businessId}"></script>`}
                </pre>
                <button
                  onClick={() => {
                    const code = `<div id="starloop-widget"></div>\n<script src="${window.location.origin}/widget.js" data-business-id="${businessId}"></script>`;
                    navigator.clipboard.writeText(code);
                    setWidgetCopied(true);
                    setTimeout(() => setWidgetCopied(false), 2000);
                  }}
                  style={{
                    position: "absolute", top: "8px", right: "8px",
                    background: "#fff", border: "1px solid #E8ECEF",
                    borderRadius: "6px", padding: "4px 10px",
                    fontSize: "0.75rem", color: "#374151", cursor: "pointer",
                  }}
                >
                  {widgetCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </details>
          </div>
        )}

        {/* ── Delete Account ── */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1A1D23" }}>Delete Account</h3>
              <p style={{ fontSize: "0.8125rem", color: "#6B7280", marginTop: "2px" }}>
                Permanently remove your account and all associated data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: "transparent", border: "1px solid #FCA5A5",
                color: "#EF4444", borderRadius: "8px",
                padding: "8px 16px", fontSize: "0.8125rem",
                fontWeight: 500, cursor: "pointer",
                transition: "background 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Delete my account
            </button>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white rounded-2xl p-6 w-full mx-4" style={{ maxWidth: "420px", boxShadow: "0 4px 24px rgba(239,68,68,0.15)" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1A1D23", marginBottom: "4px" }}>Delete your account?</h3>
              <p style={{ fontSize: "0.8125rem", color: "#6B7280", marginBottom: "16px", lineHeight: 1.5 }}>
                This will permanently delete all your data including businesses, reviews, customers, and settings. This action cannot be undone.
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
                onKeyDown={(e) => { if (e.key === "Escape") { setShowDeleteModal(false); setDeletePassword(""); } }}
                placeholder="Type your password to confirm"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px",
                  border: "1px solid #E8ECEF",
                  borderRadius: "8px", outline: "none",
                  color: "#1A1D23", fontSize: "0.875rem",
                  marginBottom: deleteError ? "8px" : "4px",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#EF4444"; e.target.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
              />
              {deleteError && (
                <p style={{ fontSize: "0.75rem", color: "#EF4444", marginBottom: "8px" }}>{deleteError}</p>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteError(""); }}
                  style={{
                    flex: 1, padding: "10px",
                    border: "1px solid #E8ECEF",
                    borderRadius: "10px", background: "#fff",
                    color: "#6B7280", fontSize: "0.875rem",
                    fontWeight: 500, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword || deleting}
                  style={{
                    flex: 1, padding: "10px",
                    border: "none", borderRadius: "10px",
                    background: "#EF4444", color: "#FFFFFF",
                    fontSize: "0.875rem", fontWeight: 600,
                    cursor: deleting ? "not-allowed" : "pointer",
                    opacity: !deletePassword || deleting ? 0.5 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {deleting ? "Deleting…" : "Delete my account"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
