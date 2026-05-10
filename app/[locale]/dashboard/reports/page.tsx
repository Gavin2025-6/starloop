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
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reputation Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Monthly AI-generated analysis of your reviews</p>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Loading reports...
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            No reports yet. Your first report will be generated automatically on the 1st of next month.
          </p>
          <p className="text-xs text-gray-400 mt-2">Available for Starter & Pro plans.</p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-40 shrink-0 space-y-1.5">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  selected?.id === r.id
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {monthLabel(r.month)}
              </button>
            ))}
          </div>

          {/* Report detail */}
          {selected && (
            <div className="flex-1 space-y-4">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <p className="text-blue-200 text-xs mb-2">{monthLabel(selected.month)}</p>
                <p className="text-sm leading-relaxed opacity-90">{selected.summary}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Avg Rating", value: `${selected.avgRating}★`, color: "text-green-700", bg: "bg-green-50" },
                  { label: "Total Reviews", value: selected.totalReviews, color: "text-blue-700", bg: "bg-blue-50" },
                  { label: "Positive", value: selected.positiveCount, color: "text-yellow-700", bg: "bg-yellow-50" },
                  {
                    label: "vs Last Month",
                    value: selected.ratingChange !== null
                      ? `${selected.ratingChange >= 0 ? "+" : ""}${selected.ratingChange}`
                      : "—",
                    color: selected.ratingChange !== null && selected.ratingChange >= 0 ? "text-green-700" : "text-red-600",
                    bg: "bg-gray-50",
                  },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Keywords */}
              <div className="grid grid-cols-2 gap-4">
                {selected.positiveKeywords.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Customers loved</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.positiveKeywords.map((k) => (
                        <span key={k} className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          ✓ {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.negativeKeywords.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Needs improvement</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.negativeKeywords.map((k) => (
                        <span key={k} className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full font-medium">
                          ! {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action items */}
              {selected.actionItems.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Action plan for next month</h3>
                  <ol className="space-y-3">
                    {selected.actionItems.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
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
