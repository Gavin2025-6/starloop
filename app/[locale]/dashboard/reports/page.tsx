"use client";

import { useEffect, useState } from "react";

interface Report {
  id: string;
  month: string;
  avgRating: number;
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  ratingChange: number | null;
  positiveKeywords: string[];
  negativeKeywords: string[];
  actionItems: string[];
  summary: string;
  emailSentAt: string | null;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelected(data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  function monthLabel(str: string) {
    const [y, m] = str.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div
      className="max-w-3xl"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>Reputation Reports</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>Monthly AI-generated analysis of your reviews</p>
      </div>

      {loading && (
        <div
          className="bg-white rounded-2xl p-12 text-center text-sm"
          style={{ border: "1px solid #E8ECEF" }}
        >
          <div className="flex justify-center mb-3">
            <div
              className="w-8 h-8 rounded-full animate-pulse"
              style={{ background: "linear-gradient(135deg, #6C63FF, #4B8EF5)" }}
            />
          </div>
          <span style={{ color: "#6B7280" }}>Loading reports...</span>
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.1), rgba(75,142,245,0.1))" }}
          >
            📊
          </div>
          <p className="text-sm max-w-xs mx-auto mb-2" style={{ color: "#6B7280" }}>
            No reports yet. Your first report will be generated automatically on the 1st of next month.
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Available for Starter &amp; Pro plans.</p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="flex gap-6">
          {/* Month sidebar */}
          <div className="w-44 shrink-0 space-y-1.5">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: selected?.id === r.id ? "linear-gradient(135deg, #6C63FF, #4B8EF5)" : "#fff",
                  color: selected?.id === r.id ? "#fff" : "#6B7280",
                  border: selected?.id === r.id ? "none" : "1px solid #E8ECEF",
                  cursor: "pointer",
                  boxShadow: selected?.id === r.id ? "0 2px 8px rgba(108,99,255,0.2)" : "none",
                }}
              >
                {monthLabel(r.month)}
              </button>
            ))}
          </div>

          {/* Report detail */}
          {selected && (
            <div className="flex-1 space-y-4">
              {/* Summary card */}
              <div
                className="rounded-2xl p-6 text-white"
                style={{ background: "linear-gradient(135deg, #6C63FF 0%, #4B8EF5 100%)" }}
              >
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {monthLabel(selected.month)}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {selected.summary}
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Avg Rating", value: `${selected.avgRating}★`, iconBg: "rgba(0,201,167,0.1)", color: "#00C9A7" },
                  { label: "Total Reviews", value: selected.totalReviews, iconBg: "rgba(75,142,245,0.1)", color: "#4B8EF5" },
                  { label: "Positive", value: selected.positiveCount, iconBg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
                  {
                    label: "vs Last Month",
                    value: selected.ratingChange !== null
                      ? `${selected.ratingChange >= 0 ? "+" : ""}${selected.ratingChange}`
                      : "—",
                    iconBg: selected.ratingChange !== null && selected.ratingChange >= 0
                      ? "rgba(0,201,167,0.1)"
                      : "rgba(255,71,87,0.1)",
                    color: selected.ratingChange !== null && selected.ratingChange >= 0 ? "#00C9A7" : "#FF4757",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white rounded-xl p-3 text-center"
                    style={{ border: "1px solid #E8ECEF" }}
                  >
                    <div className="text-xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs" style={{ color: "#6B7280" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Keywords */}
              <div className="grid grid-cols-2 gap-4">
                {selected.positiveKeywords.length > 0 && (
                  <div
                    className="bg-white rounded-2xl p-4"
                    style={{ border: "1px solid #E8ECEF" }}
                  >
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A1D23" }}>Customers loved</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.positiveKeywords.map((k) => (
                        <span
                          key={k}
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: "rgba(0,201,167,0.1)", color: "#00C9A7" }}
                        >
                          ✓ {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.negativeKeywords.length > 0 && (
                  <div
                    className="bg-white rounded-2xl p-4"
                    style={{ border: "1px solid #E8ECEF" }}
                  >
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A1D23" }}>Needs improvement</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.negativeKeywords.map((k) => (
                        <span
                          key={k}
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: "rgba(255,71,87,0.1)", color: "#FF4757" }}
                        >
                          ! {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action items */}
              {selected.actionItems.length > 0 && (
                <div
                  className="bg-white rounded-2xl p-5"
                  style={{ border: "1px solid #E8ECEF" }}
                >
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A1D23" }}>Action plan for next month</h3>
                  <ol className="space-y-3">
                    {selected.actionItems.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm" style={{ color: "#374151" }}>
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "rgba(108,99,255,0.1)", color: "#6C63FF" }}
                        >
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
