"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, AlertTriangle, TrendingUp, ArrowRight, Play } from "lucide-react";

interface Stats {
  thisMonthRecovered: number;
  thisMonthRevenue: number;
  pendingRecovery: number;
  totalCustomers: number;
  recentActivity: Array<{
    id: string;
    customerName: string;
    lastServiceDate: string | null;
    status: string;
    revenue: number;
    sentAt: string;
  }>;
}

function daysSince(date: string | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    sent: "bg-blue-100 text-blue-700",
    replied: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

const loopSteps = [
  { label: "Customer Data", value: null, key: "totalCustomers", color: "bg-[#1a2744]" },
  { label: "AI Analysis", value: null, key: "pendingRecovery", color: "bg-purple-600" },
  { label: "Auto Winback", value: null, key: "thisMonthRecovered", color: "bg-[#f97316]" },
  { label: "Revenue Track", value: null, key: "thisMonthRevenue", color: "bg-green-600" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  async function runCampaign() {
    setRunning(true);
    try {
      // First analyze, then create + execute campaign
      await fetch("/api/customers/analyze", { method: "POST" });
      const res = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "winback", targetSegment: "all" }),
      });
      const campaign = await res.json();
      await fetch(`/api/campaigns/${campaign.id}/execute`, { method: "POST" });
      // Refresh stats
      const fresh = await fetch("/api/dashboard/stats").then((r) => r.json());
      setStats(fresh);
    } finally {
      setRunning(false);
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1117]">
            {greeting}. Here&apos;s your revenue loop.
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Track and recover customers automatically.</p>
        </div>
        <button
          onClick={runCampaign}
          disabled={running}
          className="flex items-center gap-2 bg-[#f97316] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-60"
        >
          <Play size={16} />
          {running ? "Running..." : "Run Recovery Campaign"}
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <MetricCard
          icon={<Users size={20} />}
          label="Customers Recovered"
          value={loading ? "—" : String(stats?.thisMonthRecovered ?? 0)}
          sub="This month"
          accent="text-[#f97316]"
          iconBg="bg-orange-50"
        />
        <MetricCard
          icon={<DollarSign size={20} />}
          label="Revenue Recovered"
          value={loading ? "—" : `$${(stats?.thisMonthRevenue ?? 0).toLocaleString()}`}
          sub="This month"
          accent="text-green-600"
          iconBg="bg-green-50"
        />
        <MetricCard
          icon={<AlertTriangle size={20} />}
          label="Need Attention"
          value={loading ? "—" : String(stats?.pendingRecovery ?? 0)}
          sub="At-risk or lost"
          accent="text-red-500"
          iconBg="bg-red-50"
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="Total Customers"
          value={loading ? "—" : String(stats?.totalCustomers ?? 0)}
          sub="In database"
          accent="text-[#1a2744]"
          iconBg="bg-blue-50"
        />
      </div>

      {/* Revenue Loop visualization */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
          Revenue Loop
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {loopSteps.map((step, i) => {
            const val = stats ? (stats as unknown as Record<string, unknown>)[step.key] : null;
            const display =
              step.key === "thisMonthRevenue" && typeof val === "number"
                ? `$${val.toLocaleString()}`
                : String(val ?? "—");
            return (
              <div key={step.key} className="flex items-center gap-2 flex-shrink-0">
                <div className="text-center">
                  <div
                    className={`${step.color} text-white rounded-xl px-5 py-3 min-w-[120px]`}
                  >
                    <div className="text-2xl font-bold">{loading ? "—" : display}</div>
                    <div className="text-xs text-white/80 mt-1">{step.label}</div>
                  </div>
                </div>
                {i < loopSteps.length - 1 && (
                  <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0d1117]">Recent Activity</h2>
        </div>
        {loading ? (
          <div className="p-6 text-gray-400 text-sm">Loading...</div>
        ) : !stats?.recentActivity.length ? (
          <div className="p-6 text-gray-400 text-sm">No activity yet. Run your first campaign!</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-[#0d1117]">{item.customerName}</p>
                  <p className="text-xs text-gray-400">
                    Last seen {daysSince(item.lastServiceDate)} days ago
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(item.status)}`}
                  >
                    {item.status}
                  </span>
                  {item.revenue > 0 && (
                    <span className="text-sm font-semibold text-green-600">
                      +${item.revenue}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  accent,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${accent}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
        <div className={`${iconBg} p-2.5 rounded-lg ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}
