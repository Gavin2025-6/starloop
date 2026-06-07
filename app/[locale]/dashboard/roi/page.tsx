"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ROIData {
  month: string;
  invitesSent: number;
  reviewsReceived: number;
  conversionRate: number;
  ratingBefore: number | null;
  ratingNow: number | null;
  serviceRecoveryBlocked: number;
  estimatedNewCustomers: number;
  estimatedRevenue: number;
  avgTransactionValue: number | null;
  chartData: { month: string; reviews: number }[];
}

function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${highlight ? "#E8734A" : "#E5E7EB"}`,
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <div
        style={{
          fontSize: "2.25rem",
          fontWeight: 700,
          color: highlight ? "#E8734A" : "#1E3A5F",
          lineHeight: 1,
          marginBottom: "8px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>{label}</div>
      {sub && (
        <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "4px" }}>{sub}</div>
      )}
    </div>
  );
}

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  const date = new Date(Number(y), Number(mo) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function ROIPage() {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/roi")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0D1117", margin: 0 }}>ROI Dashboard</h1>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <p style={{ color: "#6B7280" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0D1117" }}>ROI Dashboard</h1>
        <p style={{ color: "#EF4444" }}>Failed to load data.</p>
      </div>
    );
  }

  const ratingChange =
    data.ratingBefore && data.ratingNow
      ? (data.ratingNow - data.ratingBefore).toFixed(1)
      : null;
  const ratingDisplay =
    data.ratingBefore && data.ratingNow
      ? `${data.ratingBefore} → ${data.ratingNow}`
      : data.ratingNow
      ? `${data.ratingNow}★`
      : "N/A";

  const chartDataFormatted = data.chartData.map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }));

  return (
    <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif", maxWidth: "960px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0D1117", margin: 0 }}>
          ROI Dashboard
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "4px" }}>
          {formatMonth(data.month)} — Track the real business impact of your review strategy.
        </p>
      </div>

      {/* 6 Metric Cards — 2×3 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <MetricCard
          label="Invites Sent"
          value={data.invitesSent}
          sub="Review requests dispatched this month"
        />
        <MetricCard
          label="Reviews Received"
          value={data.reviewsReceived}
          sub="New Google reviews this month"
        />
        <MetricCard
          label="Conversion Rate"
          value={`${data.conversionRate}%`}
          sub="Invites → reviews ratio"
        />
        <MetricCard
          label="Rating Change"
          value={ratingDisplay}
          sub={ratingChange ? `${Number(ratingChange) >= 0 ? "+" : ""}${ratingChange} since onboarding` : "Set onboarding rating in Settings"}
        />
        <MetricCard
          label="Service Recoveries"
          value={data.serviceRecoveryBlocked}
          sub="Negative feedback caught before going to Google"
        />
        <MetricCard
          label="Est. New Customers"
          value={data.estimatedNewCustomers}
          sub="Based on 25% review-to-customer conversion"
        />
      </div>

      {/* Line chart */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#0D1117", marginBottom: "20px" }}>
          Reviews Received — Last 6 Months
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartDataFormatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "0.875rem",
              }}
            />
            <Line
              type="monotone"
              dataKey="reviews"
              stroke="#E8734A"
              strokeWidth={2.5}
              dot={{ fill: "#E8734A", r: 4 }}
              activeDot={{ r: 6 }}
              name="Reviews"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orange revenue box */}
      {data.avgTransactionValue ? (
        <div
          style={{
            background: "linear-gradient(135deg, #E8734A 0%, #D4623C 100%)",
            borderRadius: "12px",
            padding: "24px",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: "0.875rem", fontWeight: 500, opacity: 0.9, marginBottom: "8px" }}>
            Estimated monthly value from new reviews
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
            ${data.estimatedRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.8125rem", opacity: 0.8, marginTop: "8px" }}>
            {data.estimatedNewCustomers} new customers × ${data.avgTransactionValue} avg transaction
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#FFF7ED",
            border: "1px solid #FED7AA",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div style={{ fontWeight: 600, color: "#92400E", marginBottom: "6px" }}>
            💡 Set your average transaction value to unlock revenue estimates
          </div>
          <p style={{ fontSize: "0.875rem", color: "#B45309", margin: 0 }}>
            Go to <strong>Settings → Business Info</strong> and enter your average transaction value
            to see monthly revenue impact.
          </p>
        </div>
      )}
    </div>
  );
}
