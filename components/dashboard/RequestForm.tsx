"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface RequestFormProps {
  businessId: string;
  customers: Customer[];
}

const TIMING_OPTIONS = [
  { label: "Send now",          value: "now",       icon: "⚡" },
  { label: "In 2 hours",        value: "2h",        icon: "⏰" },
  { label: "Tomorrow 9am",      value: "tomorrow9", icon: "🌅" },
  { label: "24h after service", value: "24h",       icon: "🕐" },
];

function getScheduledAt(timing: string): string | null {
  const now = new Date();
  if (timing === "now") return null;
  if (timing === "2h") {
    return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  }
  if (timing === "tomorrow9") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }
  if (timing === "24h") {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
  return null;
}

const baseInputStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "0.875rem",
  color: "#0D1117",
  outline: "none",
  width: "100%",
};

export default function RequestForm({ businessId, customers }: RequestFormProps) {
  const t = useTranslations();
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [customerId, setCustomerId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [channel, setChannel] = useState<"SMS" | "EMAIL">("SMS");
  const [timing, setTiming] = useState("now");
  const [loading, setLoading] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessName("");

    try {
      let targetCustomerId = customerId;
      let displayName = newName;

      if (mode === "new") {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, name: newName, phone: newPhone, email: newEmail }),
        });
        if (!res.ok) throw new Error("Failed to create customer");
        const data = await res.json();
        targetCustomerId = data.id;
      } else {
        const found = customers.find((c) => c.id === customerId);
        displayName = found?.name ?? "";
      }

      const scheduledAt = getScheduledAt(timing);

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, customerId: targetCustomerId, channel, scheduledAt }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          setError("Free plan limit: 10 SMS/month. Upgrade in Settings to send more.");
        } else {
          throw new Error(data.error ?? "Failed to send request");
        }
        return;
      }

      setSuccessName(displayName);
      setNewName(""); setNewPhone(""); setNewEmail(""); setCustomerId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("requests.requestFailed"));
    }
    setLoading(false);
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
      <h2 className="font-semibold mb-1" style={{ color: "#0D1117" }}>{t("requests.sendRequest")}</h2>
      <p className="text-xs mb-5" style={{ color: "#6B7280" }}>Send a review request to a customer</p>

      {/* Mode toggle — underline tab style */}
      <div style={{ borderBottom: "1px solid #E5E7EB", display: "flex", gap: 0, marginBottom: "24px" }}>
        <button
          type="button"
          onClick={() => setMode("new")}
          style={{
            padding: "10px 16px",
            fontSize: "0.875rem",
            transition: "all 0.15s",
            position: "relative",
            marginBottom: "-1px",
            color: mode === "new" ? "#0D1117" : "#6B7280",
            fontWeight: mode === "new" ? 500 : 400,
            background: "none",
            border: "none",
            borderBottom: mode === "new" ? "2px solid #0D1117" : "2px solid transparent",
            cursor: "pointer",
          } as React.CSSProperties}
          onMouseEnter={(e) => { if (mode !== "new") e.currentTarget.style.color = "#374151"; }}
          onMouseLeave={(e) => { if (mode !== "new") e.currentTarget.style.color = "#6B7280"; }}
        >
          {t("customers.addCustomer")}
        </button>
        <button
          type="button"
          onClick={() => setMode("existing")}
          style={{
            padding: "10px 16px",
            fontSize: "0.875rem",
            transition: "all 0.15s",
            position: "relative",
            marginBottom: "-1px",
            color: mode === "existing" ? "#0D1117" : "#6B7280",
            fontWeight: mode === "existing" ? 500 : 400,
            background: "none",
            border: "none",
            borderBottom: mode === "existing" ? "2px solid #0D1117" : "2px solid transparent",
            cursor: "pointer",
          } as React.CSSProperties}
          onMouseEnter={(e) => { if (mode !== "existing") e.currentTarget.style.color = "#374151"; }}
          onMouseLeave={(e) => { if (mode !== "existing") e.currentTarget.style.color = "#6B7280"; }}
        >
          Existing Customer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "existing" ? (
          <select
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={baseInputStyle}
          >
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : ""}</option>
            ))}
          </select>
        ) : (
          <>
            <input
              type="text"
              required
              placeholder={t("requests.customerName")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={baseInputStyle}
              onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px #0D1117"; e.target.style.borderColor = "transparent"; }}
              onBlur={(e) => { e.target.style.boxShadow = "none"; e.target.style.borderColor = "#E5E7EB"; }}
            />
            <input
              type="tel"
              placeholder="Phone (for SMS)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              style={baseInputStyle}
              onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px #0D1117"; e.target.style.borderColor = "transparent"; }}
              onBlur={(e) => { e.target.style.boxShadow = "none"; e.target.style.borderColor = "#E5E7EB"; }}
            />
            <input
              type="email"
              placeholder="Email (for email channel)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              style={baseInputStyle}
              onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px #0D1117"; e.target.style.borderColor = "transparent"; }}
              onBlur={(e) => { e.target.style.boxShadow = "none"; e.target.style.borderColor = "#E5E7EB"; }}
            />
          </>
        )}

        {/* Channel toggle */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "#6B7280" }}>Send via</p>
          <div className="flex gap-2">
            {(["SMS", "EMAIL"] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className="px-4 py-2 rounded-lg text-sm transition-all"
                style={
                  channel === ch
                    ? { background: "#0D1117", color: "#FFFFFF", border: "1px solid #0D1117", cursor: "pointer" }
                    : { background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", cursor: "pointer" }
                }
                onMouseEnter={(e) => { if (channel !== ch) e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={(e) => { if (channel !== ch) e.currentTarget.style.background = "transparent"; }}
              >
                {ch === "SMS" ? "📱 SMS" : "📧 Email"}
              </button>
            ))}
          </div>
        </div>

        {/* Timing grid */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "#6B7280" }}>When to send</p>
          <div className="grid grid-cols-2 gap-2">
            {TIMING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTiming(opt.value)}
                className="py-2.5 px-3 text-xs font-medium rounded-lg transition-all text-left"
                style={
                  timing === opt.value
                    ? { background: "#F3F4F6", color: "#0D1117", border: "1px solid #E5E7EB", cursor: "pointer" }
                    : { background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", cursor: "pointer" }
                }
                onMouseEnter={(e) => { if (timing !== opt.value) e.currentTarget.style.background = "#F9FAFB"; }}
                onMouseLeave={(e) => { if (timing !== opt.value) e.currentTarget.style.background = "transparent"; }}
              >
                <span className="mr-1.5">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}
          >
            {error}
          </div>
        )}
        {successName && (
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{ background: "#F0FDF4", color: "#10B981", border: "1px solid #A7F3D0" }}
          >
            ✓ {timing === "now" ? `Request sent to ${successName}` : `Scheduled for ${successName}`}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#0D1117] text-white w-full py-3 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-all mt-6 border-none cursor-pointer"
          style={{ opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? t("common.loading") : timing === "now" ? `📱 ${t("requests.sendNow")}` : "🕐 Schedule Send"}
        </button>
      </form>
    </div>
  );
}
