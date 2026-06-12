"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, CheckCircle, AlertCircle, Clock } from "lucide-react";
import type { ActivityEntry } from "@/lib/activity-messages";

interface JobDetail {
  id: string; jobNumber: string; title: string; serviceType: string;
  status: string; priority: string; total: number; scheduledAt: string | null;
  completedAt: string | null; createdAt: string; address: string | null;
  city: string | null; province: string | null; postalCode: string | null;
  notes: string | null;
  customer: { id: string; name: string; phone: string | null; email: string | null; };
  invoice: { id: string; status: string; } | null;
  payment: { status: string; amount: number; } | null;
  activity: ActivityEntry[];
}

const TRANSITIONS: Record<string, Array<{ to: string; label: string; color: string }>> = {
  requested:   [{ to: "scheduled",   label: "Schedule",    color: "bg-blue-500 hover:bg-blue-600" }],
  scheduled:   [{ to: "in_progress", label: "Start Work",  color: "bg-yellow-500 hover:bg-yellow-600" },
                { to: "requested",   label: "Unschedule",  color: "bg-gray-400 hover:bg-gray-500" }],
  in_progress: [],
  completed:   [],
  invoiced:    [],
  cancelled:   [],
};

const STATUS_BADGE: Record<string, string> = {
  requested:   "bg-blue-100 text-blue-700",
  scheduled:   "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed:   "bg-green-100 text-green-700",
  invoiced:    "bg-teal-100 text-teal-700",
  paid:        "bg-emerald-100 text-emerald-700",
  cancelled:   "bg-red-100 text-red-700",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtTime(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const [showEarlyOverride, setShowEarlyOverride] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/jobs/${id}`).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setJob(data);
      setNotes(data.notes ?? "");
      setFinalAmount(String(data.total ?? ""));
    }
    setLoading(false);
  }

  async function transition(to: string) {
    setTransitioning(true);
    await fetch(`/api/jobs/${id}/transition`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    await load();
    setTransitioning(false);
  }

  async function complete() {
    setTransitioning(true);
    await fetch(`/api/jobs/${id}/complete`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalAmount: parseFloat(finalAmount) || 0 }),
    });
    setShowComplete(false);
    setShowEarlyOverride(false);
    await load();
    setTransitioning(false);
  }

  async function saveNotes() {
    setSavingNotes(true);
    await fetch(`/api/jobs/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    }).catch(() => {});
    setSavingNotes(false);
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>;
  if (!job) return <div className="p-8 text-red-400 text-sm">Job not found.</div>;

  const scheduledInFuture = job.scheduledAt ? new Date(job.scheduledAt) > new Date() : false;
  const canComplete = job.status === "in_progress";
  const completeBlocked = canComplete && scheduledInFuture && !showEarlyOverride;

  const fullAddress = [job.address, job.city, job.province, job.postalCode].filter(Boolean).join(", ");
  const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null;

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      {/* Back */}
      <button onClick={() => router.push("/dashboard/jobs")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0d1117] mb-6 transition-colors">
        <ArrowLeft size={15} /> All Jobs
      </button>

      {/* ── Screen 1: Job header ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs font-mono text-gray-400 block mb-1">{job.jobNumber}</span>
            <h1 className="text-xl font-bold text-[#0d1117]">{job.serviceType}</h1>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_BADGE[job.status] ?? "bg-gray-100 text-gray-600"}`}>
              {job.status.replace("_", " ")}
            </span>
            {job.payment?.status === "paid" && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-700">💰 Paid</span>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {/* Customer */}
          <div className="flex items-center gap-2 text-gray-700">
            <span className="font-medium">{job.customer.name}</span>
            {job.customer.phone && (
              <a href={`tel:${job.customer.phone}`}
                className="flex items-center gap-1 text-[#1a2744] hover:underline ml-auto text-xs">
                <Phone size={12} /> {job.customer.phone}
              </a>
            )}
          </div>

          {/* Address */}
          {fullAddress && (
            <div className="flex items-start gap-1.5 text-gray-500">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              {mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noopener"
                  className="hover:underline text-[#1a2744] text-xs leading-relaxed">{fullAddress}</a>
              ) : (
                <span className="text-xs leading-relaxed">{fullAddress}</span>
              )}
            </div>
          )}

          {/* Scheduled */}
          {job.scheduledAt && (
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              <Clock size={12} />
              {scheduledInFuture ? (
                <span className="text-purple-700 font-medium">Scheduled: {fmtDate(job.scheduledAt)}</span>
              ) : (
                <span>Scheduled: {fmtDate(job.scheduledAt)}</span>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <span className="text-gray-400 text-xs">Amount</span>
            <span className="font-bold text-[#0d1117]">${job.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Screen 2: Actions ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Actions</h2>

        <div className="flex flex-wrap gap-2">
          {/* Normal transition buttons */}
          {(TRANSITIONS[job.status] ?? []).map((t) => (
            <button key={t.to} onClick={() => transition(t.to)} disabled={transitioning}
              className={`px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 transition-colors ${t.color}`}>
              {t.label}
            </button>
          ))}

          {/* Complete button (in_progress only) */}
          {canComplete && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => completeBlocked ? null : setShowComplete(true)}
                disabled={transitioning || completeBlocked}
                title={completeBlocked ? `Scheduled for ${fmtTime(job.scheduledAt)}` : undefined}
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${
                  completeBlocked ? "bg-gray-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                }`}>
                Mark Complete
              </button>
              {completeBlocked && (
                <button onClick={() => setShowEarlyOverride(true)}
                  className="text-xs text-gray-400 hover:text-[#0d1117] underline">
                  Finished early? Complete anyway
                </button>
              )}
            </div>
          )}

          {job.status === "completed" || job.status === "invoiced" || job.status === "paid" ? (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <CheckCircle size={15} /> Job complete
            </span>
          ) : null}
        </div>

        {/* Notes */}
        <div className="mt-5">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Visible to your team only..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
          <button onClick={saveNotes} disabled={savingNotes}
            className="mt-1.5 text-xs text-[#1a2744] hover:underline disabled:opacity-60">
            {savingNotes ? "Saving..." : "Save notes"}
          </button>
        </div>
      </div>

      {/* ── Screen 3: Activity ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Activity</h2>
        {job.activity.length === 0 ? (
          <p className="text-gray-400 text-sm">Nothing yet.</p>
        ) : (
          <ol className="space-y-3">
            {job.activity.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">{entry.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#0d1117]">{entry.human}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(entry.createdAt).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ── Complete Modal ── */}
      {(showComplete || showEarlyOverride) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle size={24} className="text-green-500" />
              <h2 className="text-lg font-bold text-[#0d1117]">Mark Complete</h2>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Final Amount ($)</label>
              <input type="number" value={finalAmount} onChange={(e) => setFinalAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-lg font-bold focus:outline-none text-[#0d1117]" />
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={14} className="text-[#f97316] mt-0.5 shrink-0" />
              <p className="text-xs text-[#f97316]">This will trigger a thank-you text and review request to the customer.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowComplete(false); setShowEarlyOverride(false); }}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={complete} disabled={transitioning}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-60">
                Confirm Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
