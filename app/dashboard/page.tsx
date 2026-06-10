"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, DollarSign, AlertTriangle, TrendingUp, Phone, FileText, Star, Briefcase } from "lucide-react";

interface Stats {
  todayJobs: number;
  callsAnswered7d: number;
  invoicedUnpaid: number;
  reviewsRequested30d: number;
  thisMonthRecovered: number;
  thisMonthRevenue: number;
  pendingRecovery: number;
  totalCustomers: number;
  recentActivity: Array<{
    id: string; customerName: string; lastServiceDate: string | null;
    status: string; revenue: number; sentAt: string;
  }>;
}

interface AgentStatus {
  intake:     { count: number; label: string };
  followup:   { count: number; label: string };
  reputation: { count: number; label: string };
  winback:    { count: number; label: string };
  referral:   { count: number; label: string };
}

interface ActivityLog {
  id: string; emoji: string; agent: string; action: string;
  detail: string | null; createdAt: string;
}

const TIMELINE_NODES = [
  { key: "callsAnswered7d",     label: "Call",    emoji: "📞" },
  { key: "todayJobs",           label: "Book",    emoji: "📅" },
  { key: "todayJobs",           label: "Service", emoji: "🔧" },
  { key: "invoicedUnpaid",      label: "Invoice", emoji: "💳", isMoney: true },
  { key: "reviewsRequested30d", label: "Review",  emoji: "⭐" },
  { key: "pendingRecovery",     label: "Winback", emoji: "↩" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function daysSince(date: string | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function statusBadge(s: string) {
  const m: Record<string, string> = {
    sent: "bg-blue-100 text-blue-700",
    replied: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return m[s] ?? "bg-gray-100 text-gray-600";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agents, setAgents] = useState<AgentStatus | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadAll = useCallback(async () => {
    const [s, a, act] = await Promise.all([
      fetch("/api/dashboard/stats").then((r) => r.json()).catch(() => null),
      fetch("/api/agents/status").then((r) => r.json()).catch(() => null),
      fetch("/api/agents/activity").then((r) => r.json()).catch(() => []),
    ]);
    setStats(s);
    setAgents(a);
    setActivity(Array.isArray(act) ? act : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function runCampaign() {
    setRunning(true);
    try {
      await fetch("/api/customers/analyze", { method: "POST" });
      const res = await fetch("/api/campaigns/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "winback", targetSegment: "all" }),
      });
      const c = await res.json();
      await fetch(`/api/campaigns/${c.id}/execute`, { method: "POST" });
      await loadAll();
    } finally { setRunning(false); }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // suppress unused variable warning
  void agents;

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1117]">
            {greeting}. Here&apos;s your revenue loop.
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Your business is running automatically.</p>
        </div>
      </div>

      {/* System status */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm font-medium text-[#0d1117]">All systems active</span>
        <span className="text-xs text-gray-400 ml-auto">Last activity: {activity.length > 0 ? timeAgo(activity[0].createdAt) : "—"}</span>
      </div>

      {/* TODAY'S BUSINESS — Row 1 */}
      <div>
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Today&apos;s Business</p>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            icon={<Briefcase size={20} />}
            label="Today's Jobs"
            value={loading ? "—" : String(stats?.todayJobs ?? 0)}
            sub="Scheduled or created today"
            accent="text-[#0d1117]"
            iconBg="bg-[#f8fafc]" />
          <MetricCard
            icon={<Phone size={20} />}
            label="Calls Answered (7d)"
            value={loading ? "—" : String(stats?.callsAnswered7d ?? 0)}
            sub="Last 7 days"
            accent="text-[#0d1117]"
            iconBg="bg-[#f8fafc]" />
          <MetricCard
            icon={<FileText size={20} />}
            label="Invoiced Unpaid ($)"
            value={loading ? "—" : `$${(stats?.invoicedUnpaid ?? 0).toLocaleString()}`}
            sub="Awaiting payment"
            accent="text-[#0d1117]"
            iconBg="bg-[#f8fafc]" />
          <MetricCard
            icon={<Star size={20} />}
            label="Reviews Requested"
            value={loading ? "—" : String(stats?.reviewsRequested30d ?? 0)}
            sub="Last 30 days"
            accent="text-[#0d1117]"
            iconBg="bg-[#f8fafc]" />
        </div>
      </div>

      {/* EXISTING METRICS — Row 2 */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={<Users size={20} />} label="Customers Recovered"
          value={loading ? "—" : String(stats?.thisMonthRecovered ?? 0)}
          sub="This month" accent="text-[#f97316]" iconBg="bg-orange-50" />
        <MetricCard icon={<DollarSign size={20} />} label="Revenue Recovered"
          value={loading ? "—" : `$${(stats?.thisMonthRevenue ?? 0).toLocaleString()}`}
          sub="This month" accent="text-green-600" iconBg="bg-green-50" />
        <MetricCard icon={<AlertTriangle size={20} />} label="Need Attention"
          value={loading ? "—" : String(stats?.pendingRecovery ?? 0)}
          sub="At-risk or lost" accent="text-red-500" iconBg="bg-red-50" />
        <MetricCard icon={<TrendingUp size={20} />} label="Total Customers"
          value={loading ? "—" : String(stats?.totalCustomers ?? 0)}
          sub="In database" accent="text-[#1a2744]" iconBg="bg-blue-50" />
      </div>

      {/* Revenue Loop — monochrome horizontal timeline */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Revenue Loop</h2>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {TIMELINE_NODES.map((node, i) => {
            const raw = stats ? (stats as unknown as Record<string, unknown>)[node.key] : null;
            const numVal = typeof raw === "number" ? raw : 0;
            const isActive = !loading && numVal > 0;
            const display = node.isMoney && typeof raw === "number"
              ? `$${(raw as number).toLocaleString()}`
              : typeof raw === "number" ? String(raw) : "—";

            return (
              <div key={`${node.key}-${i}`} className="flex items-start flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${isActive ? "bg-[#0d1117] text-white" : "bg-[#e2e8f0] text-[#0d1117]"}`}>
                    {node.emoji}
                  </div>
                  <span className="text-xs text-[#64748b] mt-1.5 text-center">{node.label}</span>
                  <span className="text-sm font-bold text-[#0d1117] mt-0.5">
                    {loading ? "—" : display}
                  </span>
                </div>
                {i < TIMELINE_NODES.length - 1 && (
                  <span className="text-[#e2e8f0] text-lg mx-3 mt-1.5 flex-shrink-0">→</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Run Recovery Campaign — secondary style, below timeline */}
        <div className="mt-5 pt-4 border-t border-[#e2e8f0]">
          <button onClick={runCampaign} disabled={running}
            className="flex items-center gap-2 border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
            ↩ {running ? "Running..." : "Run Recovery Campaign"}
          </button>
        </div>
      </div>

      {/* Bottom row: Recent Campaign Activity + Agent Feed */}
      <div className="grid grid-cols-2 gap-4">

        {/* Campaign Activity */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-[#0d1117] text-sm">Campaign Activity</h2>
          </div>
          {loading ? (
            <div className="p-5 text-gray-300 text-sm">Loading...</div>
          ) : !stats?.recentActivity.length ? (
            <div className="p-5 text-gray-400 text-sm">No activity yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-[#0d1117]">{item.customerName}</p>
                    <p className="text-xs text-gray-400">Last seen {daysSince(item.lastServiceDate)}d ago</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                    {item.revenue > 0 && (
                      <span className="text-xs font-semibold text-green-600">+${item.revenue}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Activity Feed */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#0d1117] text-sm">Agent Activity</h2>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          {activity.length === 0 ? (
            <div className="p-5 text-gray-400 text-sm">
              Agents are on standby. Activity appears here in real-time.
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {activity.map((log) => (
                <div key={log.id} className="px-5 py-2.5 flex items-start gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{log.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0d1117] truncate">{log.action}</p>
                    {log.detail && (
                      <p className="text-xs text-gray-400 truncate">{log.detail}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 flex-shrink-0">{timeAgo(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, accent, iconBg }: {
  icon: React.ReactNode; label: string; value: string;
  sub: string; accent: string; iconBg: string;
}) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${accent}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
        <div className={`${iconBg} p-2.5 rounded-lg ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}
