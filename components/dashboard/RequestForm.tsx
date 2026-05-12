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

  const inputStyle = {
    border: "1px solid #E8ECEF",
    borderRadius: "8px",
    outline: "none",
    color: "#1A1D23",
    width: "100%",
  };

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
    <div
      className="bg-white rounded-2xl p-6"
      style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <h2 className="font-semibold mb-1" style={{ color: "#1A1D23" }}>{t("requests.sendRequest")}</h2>
      <p className="text-xs mb-5" style={{ color: "#6B7280" }}>Send a review request to a customer</p>

      {/* Mode toggle — pill style */}
      <div
        className="flex p-1 mb-5"
        style={{ background: "#F0F0F5", borderRadius: "10px" }}
      >
        <button
          type="button"
          onClick={() => setMode("new")}
          className="flex-1 py-1.5 text-xs font-medium transition-all"
          style={{
            borderRadius: "8px",
            background: mode === "new" ? "#fff" : "transparent",
            color: mode === "new" ? "#1A1D23" : "#6B7280",
            border: "none",
            cursor: "pointer",
            boxShadow: mode === "new" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          {t("customers.addCustomer")}
        </button>
        <button
          type="button"
          onClick={() => setMode("existing")}
          className="flex-1 py-1.5 text-xs font-medium transition-all"
          style={{
            borderRadius: "8px",
            background: mode === "existing" ? "#fff" : "transparent",
            color: mode === "existing" ? "#1A1D23" : "#6B7280",
            border: "none",
            cursor: "pointer",
            boxShadow: mode === "existing" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
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
            className="px-3 py-2.5 text-sm"
            style={inputStyle}
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
              className="px-3 py-2.5 text-sm"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
            />
            <input
              type="tel"
              placeholder="Phone (for SMS)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="px-3 py-2.5 text-sm"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
            />
            <input
              type="email"
              placeholder="Email (for email channel)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="px-3 py-2.5 text-sm"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
            />
          </>
        )}

        {/* Channel toggle */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "#6B7280" }}>Send via</p>
          <div
            className="flex p-1"
            style={{ background: "#F0F0F5", borderRadius: "10px" }}
          >
            {(["SMS", "EMAIL"] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className="flex-1 py-2 text-xs font-medium transition-all"
                style={{
                  borderRadius: "8px",
                  background: channel === ch ? "linear-gradient(135deg, #00C9A7, #4A6FFF)" : "transparent",
                  color: channel === ch ? "#fff" : "#6B7280",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: channel === ch ? "0 1px 3px rgba(0,201,167,0.3)" : "none",
                }}
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
                className="py-2.5 px-3 text-xs font-medium transition-all text-left"
                style={{
                  borderRadius: "8px",
                  border: timing === opt.value ? "1px solid #4A6FFF" : "1px solid #E8ECEF",
                  background: timing === opt.value ? "rgba(0,201,167,0.06)" : "#fff",
                  color: timing === opt.value ? "#4A6FFF" : "#6B7280",
                  cursor: "pointer",
                }}
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
            style={{ background: "#FFF5F5", color: "#FF4757", border: "1px solid #FFD0D0" }}
          >
            {error}
          </div>
        )}
        {successName && (
          <div
            className="text-xs px-3 py-2 rounded-lg"
            style={{ background: "rgba(0,201,167,0.08)", color: "#00C9A7", border: "1px solid rgba(0,201,167,0.2)" }}
          >
            ✓ {timing === "now" ? `Request sent to ${successName}` : `Scheduled for ${successName}`}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-white py-3 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #00C9A7 0%, #4A6FFF 100%)",
            borderRadius: "10px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? t("common.loading") : timing === "now" ? `📱 ${t("requests.sendNow")}` : "🕐 Schedule Send"}
        </button>
      </form>
    </div>
  );
}
