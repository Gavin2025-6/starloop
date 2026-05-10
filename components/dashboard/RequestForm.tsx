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
  { label: "Send now", value: "now" },
  { label: "In 2 hours", value: "2h" },
  { label: "Tomorrow 9am", value: "tomorrow9" },
  { label: "24h after service", value: "24h" },
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
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">{t("requests.sendRequest")}</h2>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setMode("new")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${mode === "new" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          {t("customers.addCustomer")}
        </button>
        <button type="button" onClick={() => setMode("existing")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${mode === "existing" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Existing Customer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "existing" ? (
          <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : ""}</option>
            ))}
          </select>
        ) : (
          <>
            <input type="text" required placeholder={t("requests.customerName")} value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="tel" placeholder="Phone (for SMS)" value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="email" placeholder="Email (for email channel)" value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </>
        )}

        {/* Channel */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Send via</p>
          <div className="flex gap-2">
            {(["SMS", "EMAIL"] as const).map((ch) => (
              <button key={ch} type="button" onClick={() => setChannel(ch)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  channel === ch ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                {ch === "SMS" ? "📱 SMS" : "📧 Email"}
              </button>
            ))}
          </div>
        </div>

        {/* Timing */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5">When to send</p>
          <div className="grid grid-cols-2 gap-1.5">
            {TIMING_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setTiming(opt.value)}
                className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  timing === opt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        {successName && (
          <div className="text-green-600 text-xs bg-green-50 px-3 py-2 rounded-lg">
            ✓ {timing === "now" ? `Request sent to ${successName}` : `Scheduled for ${successName}`}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? t("common.loading") : timing === "now" ? `📱 ${t("requests.sendNow")}` : "🕐 Schedule Send"}
        </button>
      </form>
    </div>
  );
}
