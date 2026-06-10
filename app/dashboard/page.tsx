"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, DollarSign, AlertTriangle, TrendingUp, Play, ArrowRight } from "lucide-react";

interface Stats {
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

const AGENT_COLORS: Record<string, string> = {
  intake: "bg-blue-500", followup: "bg-purple-500",
  reputation: "bg-yellow-500", winback: "bg-orange-500", referral: "bg-green-500",
};

const LOOP_NODES = [
  { key: "totalCustomers",   label: "Call",     color: "bg-[#1a2744]",  emoji: "📞" },
  { key: "totalCustomers",   label: "Book",     color: "bg-blue-600",   emoji: "📅" },
  { key: "totalCustomers",   label: "Service",  color: "bg-purple-600", emoji: "🔧" },
  { key: "thisMonthRevenue", label: "Payment",  color: "bg-green-600",  emoji: "💳", isMoney: true },
  { key: "reputationCount",  label: "Review",   color: "bg-yellow-500", emoji: "⭐" },
  { key: "pendingRecovery",  label: "Winback",  color: "bg-[#f97316]",  emoji: "↩️" },
  { key: "referralCount",    label: "Referral", color: "bg-teal-600",   emoji: "🤝" },
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

  const agentEntries = agents
    ? (["intake","followup","reputation","winback","referral"] as const).map((k) => ({
        key: k, ...agents[k],
      }))
    : [];

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1117]">
            {greeting}. Here&apos;s your revenue loop.
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">All 5 agents working automatically.</p>
        </div>
        <button onClick={runCampaign} disabled={running}
          className="flex items-center gap-2 bg-[#f97316] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-60">
          <Play size={15} />
          {running ? "Running..." : "Run Recovery Campaign"}
        </button>
      </div>

      {/* Agent Status Bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-6 overflow-x-auto">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">Agents</span>
        {agentEntries.map(({ key, label, count }) => (
          <div key={key} className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${AGENT_COLORS[key]} shadow-sm`} />
            <span className="text-sm font-medium text-[#0d1117]">{label}</span>
            {count > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{count} today</span>
            )}
          </div>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* 7-Node Revenue Loop */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Revenue Loop</h2>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {LOOP_NODES.map((node, i) => {
            const raw = stats ? (stats as unknown as Record<string, unknown>)[node.key] : null;
            const display = node.isMoney && typeof raw === "number"
              ? `$${(raw as number).toLocaleString()}`
              : typeof raw === "number" ? String(raw) : "—";
            return (
              <div key={`${node.key}-${i}`} className="flex items-center gap-1.5 flex-shrink-0">
                <div className={`${node.color} text-white rounded-xl px-4 py-3 text-center min-w-[80px]`}>
                  <div className="text-lg">{node.emoji}</div>
                  <div className="text-sm font-bold mt-0.5">
                    {node.key === "reputationCount" || node.key === "referralCount" ? "—" : loading ? "—" : display}
                  </div>
                  <div className="text-[10px] text-white/70 mt-0.5">{node.label}</div>
                </div>
                {i < LOOP_NODES.length - 1 && <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />}
              </div>
            );
          })}
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
    <div className="bg-white border border-gray-200 rounded-xl p-5">
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
