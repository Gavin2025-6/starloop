"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
}

interface RequestFormProps {
  businessId: string;
  customers: Customer[];
}

export default function RequestForm({ businessId, customers }: RequestFormProps) {
  const t = useTranslations();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      let targetCustomerId = customerId;

      // Create new customer first if needed
      if (mode === "new") {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, name: newName, phone: newPhone }),
        });
        if (!res.ok) throw new Error("Failed to create customer");
        const data = await res.json();
        targetCustomerId = data.id;
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, customerId: targetCustomerId }),
      });

      if (!res.ok) throw new Error("Failed to send request");
      setSuccess(true);
      setCustomerId("");
      setNewName("");
      setNewPhone("");
    } catch {
      setError(t("requests.requestFailed"));
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">
        {t("requests.sendRequest")}
      </h2>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("existing")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === "existing"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Existing Customer
        </button>
        <button
          onClick={() => setMode("new")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === "new"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {t("customers.addCustomer")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "existing" ? (
          <select
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `— ${c.phone}` : ""}
              </option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              required
              placeholder={t("requests.customerPhone")}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}

        {error && (
          <div className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 text-xs bg-green-50 px-3 py-2 rounded-lg">
            ✓ {t("requests.requestSent")}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t("common.loading") : `📱 ${t("requests.sendNow")}`}
        </button>
      </form>
    </div>
  );
}
