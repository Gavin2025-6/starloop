"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, CheckCircle, Clock, X, ChevronRight } from "lucide-react";

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
  { value: "at-risk", label: "At-Risk",      desc: "61–120 days since last service",  color: "border-amber-300 bg-amber-50" },
  { value: "lost",    label: "Lost",          desc: "120+ days since last service",    color: "border-red-300 bg-red-50" },
  { value: "all",     label: "All Inactive",  desc: "Everyone who needs recovery",     color: "border-blue-300 bg-blue-50" },
];

const CARD_SHADOW = "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]";

type CampaignStep = null | 1 | 2 | 3;

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`relative w-10 h-5 rounded-full shrink-0 transition-colors ${on ? "bg-[#0D1117]" : "bg-gray-200"}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [executing, setExecuting] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // Auto-winback state
  const [autoWinback, setAutoWinback]     = useState(false);
  const [winbackDays, setWinbackDays]     = useState("90");
  const [winbackPreview, setWinbackPreview] = useState("");
  const [showWinbackPreview, setShowWinbackPreview] = useState(false);
  const [winbackCount, setWinbackCount]   = useState<number | null>(null);

  // New campaign wizard state
  const [step, setStep] = useState<CampaignStep>(null);
  const [segment, setSegment]   = useState("at-risk");
  const [eligible, setEligible] = useState<number | null>(null);
  const [smsPreview, setSmsPreview] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [creating, setCreating] = useState(false);

  // Countdown toast after send
  const [toast, setToast] = useState<{ sentCount: number; secondsLeft: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadCampaigns(); }, []);

  useEffect(() => {
    if (autoWinback) fetchWinbackCount();
  }, [autoWinback, winbackDays]);

  useEffect(() => () => { if (toastTimerRef.current) clearInterval(toastTimerRef.current); }, []);

  async function loadCampaigns() {
    const res = await fetch("/api/campaigns/list").catch(() => null);
    if (res?.ok) setCampaigns(await res.json());
  }

  async function fetchEligible(seg: string) {
    setEligible(null);
    const res = await fetch(`/api/customers/count?segment=${seg}`).catch(() => null);
    if (res?.ok) { const d = await res.json(); setEligible(d.count); }
  }

  async function fetchWinbackCount() {
    const res = await fetch(`/api/customers/count?segment=at-risk`).catch(() => null);
    if (res?.ok) { const d = await res.json(); setWinbackCount(d.count); }
  }

  async function fetchSmsPreview() {
    setPreviewLoading(true);
    const res = await fetch("/api/campaigns/preview-sms").catch(() => null);
    if (res?.ok) { const d = await res.json(); setSmsPreview(d.sms); setWinbackPreview(d.sms); }
    setPreviewLoading(false);
  }

  function openStep1() {
    setStep(1);
    setSegment("at-risk");
    setEligible(null);
    setSmsPreview("");
    setConfirmInput("");
    fetchEligible("at-risk");
  }

  function goStep2() {
    setStep(2);
    if (!smsPreview) fetchSmsPreview();
  }

  function goStep3() { setStep(3); }

  function cancelWizard() {
    setStep(null);
    setConfirmInput("");
  }

  async function createAndExecute() {
    if (confirmInput !== "SEND") return;
    setCreating(true);
    const res = await fetch("/api/campaigns/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "winback", targetSegment: segment }),
    });
    const campaign = await res.json();
    setCreating(false);
    setStep(null);
    setConfirmInput("");
    setCampaigns(prev => [{ ...campaign, _resultCount: 0 }, ...prev]);

    // Execute with progress
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
    setProgress(null);
    setExecuting(null);
    setCampaigns(prev =>
      prev.map(c => c.id === campaign.id
        ? { ...c, status: "sent", sentAt: new Date().toISOString(), _resultCount: total }
        : c)
    );

    // Start countdown toast (5 min = 300 seconds)
    setToast({ sentCount: total, secondsLeft: 300 });
    toastTimerRef.current = setInterval(() => {
      setToast(t => {
        if (!t || t.secondsLeft <= 1) {
          if (toastTimerRef.current) clearInterval(toastTimerRef.current);
          return null;
        }
        return { ...t, secondsLeft: t.secondsLeft - 1 };
      });
    }, 1000);
  }

  function fmtCountdown(s: number) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  const nextSunday = (() => {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  })();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-5">

        <h1 className="text-2xl font-bold text-[#0D1117]">Campaigns</h1>

        {/* ── SECTION 1: AUTO WINBACK ── */}
        <div className={`bg-white rounded-xl p-5 ${CARD_SHADOW}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-[#0D1117]">Automatic Winback</h2>
              <p className="text-xs text-gray-400 mt-0.5">Automatically reach out to inactive customers</p>
            </div>
            <Toggle on={autoWinback} onToggle={() => setAutoWinback(a => !a)} />
          </div>

          {autoWinback && (
            <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
              {/* Days control */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Trigger after days of inactivity</label>
                <div className="flex gap-2">
                  {["60","90","120","180"].map(d => (
                    <button key={d} onClick={() => setWinbackDays(d)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        winbackDays === d
                          ? "bg-[#0D1117] text-white border-[#0D1117]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <span className="font-medium text-[#0D1117]">Send time:</span> Sundays at 6:00 PM
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                <span className="text-gray-500">Next scheduled send: </span>
                <span className="font-semibold text-[#0D1117]">{nextSunday}</span>
                {winbackCount !== null && (
                  <span className="text-gray-400 ml-2">· Est. {winbackCount} customers</span>
                )}
              </div>

              <button
                onClick={() => { fetchSmsPreview(); setShowWinbackPreview(true); }}
                className="text-sm text-[#4A6FFF] hover:underline font-medium"
              >
                Preview Message →
              </button>
            </div>
          )}
        </div>

        {/* ── SECTION 2: CAMPAIGN HISTORY or WIZARD ── */}
        {step === null ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0D1117]">Campaign History</h2>
              <button onClick={openStep1}
                className="flex items-center gap-2 bg-[#0D1117] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151] transition-colors">
                <Plus size={15} /> New Campaign
              </button>
            </div>

            {/* Execute progress bar */}
            {progress && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0D1117] mb-1">
                    Sending {progress.current}/{progress.total}…
                  </p>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                  </div>
                </div>
                {progress.current >= progress.total && (
                  <span className="text-green-600 font-semibold text-sm">✓ Done!</span>
                )}
              </div>
            )}

            {campaigns.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <p className="text-gray-400 text-sm mb-4">No campaigns sent yet.</p>
                <button onClick={openStep1}
                  className="bg-[#0D1117] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151]">
                  Launch First Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(c => {
                  const badge = statusBadge(c.status);
                  const isRunning = executing === c.id;
                  return (
                    <div key={c.id} className={`bg-white rounded-xl px-5 py-4 flex items-center justify-between ${CARD_SHADOW}`}>
                      <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-semibold text-[#0D1117] capitalize">{c.type} Campaign</span>
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
                          setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: "sent", sentAt: new Date().toISOString() } : x));
                        }}
                          className="text-xs bg-[#0D1117] text-white px-3 py-1.5 rounded-lg hover:bg-[#374151]">
                          Execute
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ── WIZARD STEPS ── */
          <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            {/* Wizard header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {[1,2,3].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      s < step ? "bg-[#16A34A] text-white" :
                      s === step ? "bg-[#0D1117] text-white" :
                      "bg-gray-100 text-gray-400"
                    }`}>{s < step ? "✓" : s}</div>
                    {s < 3 && <ChevronRight size={14} className="text-gray-300" />}
                  </div>
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  {step === 1 ? "Select Segment" : step === 2 ? "Review Message" : "Confirm & Send"}
                </span>
              </div>
              <button onClick={cancelWizard} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="px-6 py-6">
              {/* ── Step 1: Segment ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#0D1117]">Who do you want to reach?</h3>
                  <div className="space-y-3">
                    {SEGMENTS.map(s => (
                      <button key={s.value} onClick={() => { setSegment(s.value); fetchEligible(s.value); }}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                          segment === s.value ? s.color : "border-gray-100 hover:border-gray-200"
                        }`}>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#0D1117]">{s.label}</span>
                            {segment === s.value && eligible !== null && (
                              <span className="text-xs font-bold text-[#0D1117]">{eligible} customers</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {eligible === 0 && (
                    <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                      No customers in this segment yet.
                    </p>
                  )}

                  <button onClick={goStep2} disabled={!eligible || eligible === 0}
                    className="w-full bg-[#0D1117] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#374151] disabled:opacity-40 transition-colors">
                    Next →
                  </button>
                </div>
              )}

              {/* ── Step 2: Message ── */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#0D1117]">Review your message</h3>

                  {/* Phone mockup */}
                  <div className="bg-gray-100 rounded-2xl p-4 max-w-xs mx-auto">
                    <div className="bg-white rounded-xl p-3 text-xs text-gray-700 shadow-sm leading-relaxed min-h-[60px]">
                      {previewLoading ? (
                        <span className="text-gray-300 animate-pulse">Generating preview…</span>
                      ) : (
                        smsPreview || "Hi [Name], it's been a while since your last visit! We'd love to have you back."
                      )}
                    </div>
                  </div>

                  <button onClick={fetchSmsPreview} className="text-xs text-[#4A6FFF] hover:underline">↻ Regenerate</button>

                  <textarea
                    rows={3}
                    value={smsPreview}
                    onChange={e => setSmsPreview(e.target.value)}
                    placeholder="Or customize the message…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
                  />

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)}
                      className="flex-1 border border-gray-200 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                      ← Back
                    </button>
                    <button onClick={goStep3}
                      className="flex-1 bg-[#0D1117] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#374151]">
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Confirm ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <div className="text-4xl mb-2">⚠️</div>
                    <h3 className="text-lg font-bold text-[#0D1117]">
                      You&apos;re about to send to {eligible ?? "?"} customers
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">This message will go out immediately.</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                    {smsPreview}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Type <span className="text-[#0D1117]">SEND</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={confirmInput}
                      onChange={e => setConfirmInput(e.target.value)}
                      placeholder="Type SEND"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)}
                      className="flex-1 border border-gray-200 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                      Cancel
                    </button>
                    <button
                      onClick={createAndExecute}
                      disabled={confirmInput !== "SEND" || creating}
                      className="flex-1 bg-[#DC2626] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#B91C1C] disabled:opacity-40 transition-colors"
                    >
                      {creating ? "Sending…" : `Send Campaign`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Toast countdown */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0D1117] text-white rounded-xl px-6 py-4 shadow-xl w-[min(360px,90vw)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">
              ✓ Sending to {toast.sentCount} customers in {fmtCountdown(toast.secondsLeft)}…
            </span>
            <button onClick={() => { setToast(null); if (toastTimerRef.current) clearInterval(toastTimerRef.current); }}
              className="text-white/60 hover:text-white ml-3">
              <X size={16} />
            </button>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000"
              style={{ width: `${(toast.secondsLeft / 300) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Winback preview modal */}
      {showWinbackPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#0D1117]">Auto-Winback Message Preview</h2>
              <button onClick={() => setShowWinbackPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed min-h-[80px]">
              {previewLoading ? <span className="text-gray-300 animate-pulse">Loading…</span> : winbackPreview}
            </div>
            <button onClick={() => setShowWinbackPreview(false)}
              className="mt-4 w-full bg-[#0D1117] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151]">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
