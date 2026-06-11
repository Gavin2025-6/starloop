"use client";

import { useEffect, useState } from "react";
import { Plus, Play, CheckCircle, Clock, X } from "lucide-react";

interface Campaign {
  id: string; type: string; status: string; targetSegment: string;
  createdAt: string; sentAt: string | null; eligibleCustomers?: number;
  _resultCount?: number;
}

function statusBadge(s: string) {
  if (s === "sent") return { cls: "bg-green-100 text-green-700", icon: <CheckCircle size={11} /> };
  return { cls: "bg-gray-100 text-gray-500", icon: <Clock size={11} /> };
}

const SEGMENTS = [
  { value: "at-risk", label: "At-Risk Customers", desc: "61–120 days since last service" },
  { value: "lost",    label: "Lost Customers",    desc: "120+ days since last service" },
  { value: "all",     label: "All Inactive",      desc: "Everyone who needs recovery" },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [segment, setSegment] = useState("at-risk");
  const [eligible, setEligible] = useState<number | null>(null);
  const [smsPreview, setSmsPreview] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => { loadCampaigns(); }, []);

  async function loadCampaigns() {
    const res = await fetch("/api/campaigns/list").catch(() => null);
    if (res?.ok) setCampaigns(await res.json());
  }

  async function openModal() {
    setShowModal(true);
    setEligible(null); setSmsPreview(""); setSegment("at-risk");
    fetchEligible("at-risk");
    fetchSmsPreview();
  }

  async function fetchEligible(seg: string) {
    const res = await fetch(`/api/customers/count?segment=${seg}`).catch(() => null);
    if (res?.ok) { const d = await res.json(); setEligible(d.count); }
  }

  async function fetchSmsPreview() {
    setPreviewLoading(true);
    const res = await fetch("/api/campaigns/preview-sms").catch(() => null);
    if (res?.ok) { const d = await res.json(); setSmsPreview(d.sms); }
    setPreviewLoading(false);
  }

  function changeSegment(s: string) {
    setSegment(s); setEligible(null);
    fetchEligible(s);
  }

  async function createAndExecute() {
    setCreating(true);
    const res = await fetch("/api/campaigns/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "winback", targetSegment: segment }),
    });
    const campaign = await res.json();
    setShowModal(false); setCreating(false);
    setCampaigns((prev) => [{ ...campaign, _resultCount: 0 }, ...prev]);

    // Execute with progress simulation
    setExecuting(campaign.id);
    const total = eligible ?? 1;
    let cur = 0;
    const interval = setInterval(() => {
      cur++;
      setProgress({ current: Math.min(cur, total), total });
      if (cur >= total) clearInterval(interval);
    }, 400);

    await fetch(`/api/campaigns/${campaign.id}/execute`, { method: "POST" });
    clearInterval(interval);
    setProgress(null); setExecuting(null);
    setCampaigns((prev) =>
      prev.map((c) => c.id === campaign.id ? { ...c, status: "sent", sentAt: new Date().toISOString(), _resultCount: total } : c)
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1117]">Campaigns</h1>
          <p className="text-gray-400 text-sm mt-0.5">AI-personalized SMS to win back customers</p>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-2 bg-[#f97316] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
          <Plus size={16} /> New Winback Campaign
        </button>
      </div>

      {/* Execute progress bar */}
      {progress && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0d1117] mb-1">
              Sending {progress.current}/{progress.total}...
            </p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f97316] rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
          {progress.current >= progress.total && (
            <span className="text-green-600 font-semibold text-sm">✓ Done!</span>
          )}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play size={28} className="text-[#f97316]" />
          </div>
          <h2 className="text-lg font-semibold text-[#0d1117] mb-2">No campaigns yet</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Create a winback campaign to automatically re-engage at-risk customers via AI-personalized SMS.
          </p>
          <button onClick={openModal}
            className="bg-[#f97316] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600">
            Launch First Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const badge = statusBadge(c.status);
            const isRunning = executing === c.id;
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-[#0d1117] capitalize">{c.type} Campaign</span>
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${badge.cls}`}>
                      {badge.icon} {isRunning ? "running…" : c.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Target: <span className="font-medium text-gray-600">{c.targetSegment}</span>
                    {c.eligibleCustomers != null && ` · ${c.eligibleCustomers} customers`}
                    {` · ${new Date(c.createdAt).toLocaleDateString()}`}
                    {c.sentAt && ` · Sent ${new Date(c.sentAt).toLocaleDateString()}`}
                  </p>
                </div>
                {c.status === "draft" && !isRunning && (
                  <button onClick={async () => {
                    setExecuting(c.id);
                    await fetch(`/api/campaigns/${c.id}/execute`, { method: "POST" });
                    setExecuting(null);
                    setCampaigns((prev) => prev.map((x) => x.id === c.id ? { ...x, status: "sent", sentAt: new Date().toISOString() } : x));
                  }}
                    className="flex items-center gap-1.5 bg-[#1a2744] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#243460]">
                    <Play size={12} /> Execute
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0d1117]">New Winback Campaign</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Segment picker */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Target Customers</label>
              <div className="space-y-2">
                {SEGMENTS.map((s) => (
                  <label key={s.value}
                    className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${segment === s.value ? "border-[#1a2744] bg-blue-50/50" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="segment" value={s.value} checked={segment === s.value}
                      onChange={() => changeSegment(s.value)} className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-[#0d1117]">{s.label}</div>
                      <div className="text-xs text-gray-400">{s.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Eligible count */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5 text-sm">
              {eligible === null
                ? <span className="text-gray-400">Counting eligible customers...</span>
                : eligible === 0
                ? <span className="text-gray-500">No customers in this segment yet.</span>
                : <span className="text-[#1a2744] font-semibold">📤 Will send to <span className="text-[#f97316]">{eligible} customers</span></span>
              }
            </div>

            {/* SMS Preview */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Sample AI Message</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 min-h-[60px]">
                {previewLoading ? (
                  <span className="text-gray-300 animate-pulse">Generating preview...</span>
                ) : smsPreview || (
                  <span className="text-gray-300">Hi [Name], it&apos;s been a while since your last visit at [Business]! We&apos;d love to have you back. Book here: {process.env.NEXT_PUBLIC_APP_URL}/b/[slug]</span>
                )}
              </div>
              <button onClick={fetchSmsPreview} className="text-xs text-[#1a2744] mt-1 hover:underline">↻ Regenerate</button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={createAndExecute} disabled={creating || eligible === 0}
                className="flex-1 bg-[#f97316] text-white py-3 rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-60">
                {creating ? "Creating..." : `Send to ${eligible ?? "?"} Customers`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
