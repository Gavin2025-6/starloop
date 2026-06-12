"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import type { ActivityEntry } from "@/lib/activity-messages";

interface JobDetail {
  id: string; jobNumber: string; title: string; serviceType: string;
  status: string; priority: string; total: number; scheduledAt: string | null;
  completedAt: string | null; createdAt: string; address: string | null;
  city: string | null; province: string | null; postalCode: string | null;
  notes: string | null;
  customer: { id: string; name: string; phone: string | null; email: string | null };
  invoice: { id: string; status: string } | null;
  payment: { status: string; amount: number } | null;
  activity: ActivityEntry[];
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  scheduled:   { label: "Scheduled",   bg: "bg-[#EFF6FF]",  text: "text-[#1D4ED8]"   },
  in_progress: { label: "In Progress", bg: "bg-[#FFFBEB]",  text: "text-[#B45309]"   },
  completed:   { label: "Complete",    bg: "bg-[#F0FDF4]",  text: "text-[#15803D]"   },
  requested:   { label: "Requested",   bg: "bg-gray-100",   text: "text-gray-600"    },
  invoiced:    { label: "Invoiced",    bg: "bg-teal-50",    text: "text-teal-700"    },
  paid:        { label: "Paid",        bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled:   { label: "Cancelled",   bg: "bg-red-50",     text: "text-red-700"     },
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function fmtActivity(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

const CARD_SHADOW = { boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" };

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
  const [sendingPayment, setSendingPayment] = useState(false);
  const [sendingReview, setSendingReview] = useState(false);
  const [reviewSentAt, setReviewSentAt] = useState<string | null>(null);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/jobs/${id}`).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setJob(data);
      setNotes(data.notes ?? "");
      setFinalAmount(String(data.total ?? ""));
      // Detect if a review request was already sent via events
      const events: Array<{ type: string; payload: Record<string, unknown> | null; createdAt: string }> = data.events ?? [];
      const rrEvent = events.find(e => e.type === "sms_sent" && (e.payload as Record<string,unknown>)?.kind === "review_request");
      setReviewSentAt(rrEvent?.createdAt ?? null);
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

  async function sendReviewRequest() {
    setSendingReview(true);
    await fetch(`/api/jobs/${id}/review-request`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
    setReviewSentAt(new Date().toISOString());
    setSendingReview(false);
  }

  async function sendPaymentLink() {
    setSendingPayment(true);
    await fetch(`/api/jobs/${id}/invoice`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
    await load();
    setSendingPayment(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }
  if (!job) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-red-400 text-sm">Job not found.</div>
      </div>
    );
  }

  const scheduledInFuture = job.scheduledAt ? new Date(job.scheduledAt) > new Date() : false;
  const canComplete = job.status === "in_progress";
  const completeBlocked = canComplete && scheduledInFuture && !showEarlyOverride;
  const isComplete = ["completed", "invoiced", "paid"].includes(job.status);
  const isScheduled = job.status === "scheduled" || job.status === "requested";
  const fullAddress = [job.address, job.city, job.province, job.postalCode].filter(Boolean).join(", ");
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  const sc = STATUS_CFG[job.status] ?? { label: job.status, bg: "bg-gray-100", text: "text-gray-600" };

  const isPaid = job.payment?.status === "paid";
  const isLinkSent = !isPaid && (job.invoice?.status === "sent" || job.invoice?.status === "viewed");

  // Sorted activity: newest first
  const sortedActivity = [...job.activity].reverse();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 pb-24 lg:pb-8">

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/jobs")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0D1117] mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> All Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">

            {/* Job header card */}
            <div className="bg-white rounded-xl p-5" style={CARD_SHADOW}>
              {/* Title + Status */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-2xl font-bold text-[#0D1117] leading-tight">{job.serviceType}</h1>
                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${sc.bg} ${sc.text}`}
                  style={{ borderRadius: "20px" }}
                >
                  {sc.label}
                </span>
              </div>

              {/* Amount */}
              <div className="text-[28px] font-bold text-[#0D1117] mb-4 leading-none">
                ${job.total.toLocaleString()}
              </div>

              {/* Customer row */}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <button
                  onClick={() => router.push(`/dashboard/customers/${job.customer.id}`)}
                  className="text-sm font-semibold text-[#0D1117] hover:text-[#4A6FFF] hover:underline transition-colors"
                >
                  {job.customer.name}
                </button>
                {job.customer.phone && (
                  <a
                    href={`tel:${job.customer.phone}`}
                    className="flex items-center gap-1.5 text-sm text-[#4A6FFF] hover:underline"
                  >
                    <Phone size={13} />
                    {job.customer.phone}
                  </a>
                )}
              </div>

              {/* Scheduled */}
              {job.scheduledAt && (
                <div className="flex items-center gap-2 py-3 border-t border-gray-100">
                  <Clock size={14} className="text-gray-400 shrink-0" />
                  <span className={`text-sm ${scheduledInFuture ? "text-[#1D4ED8] font-medium" : "text-gray-500"}`}>
                    {fmtDate(job.scheduledAt)}
                  </span>
                </div>
              )}

              {/* Address */}
              <div className="flex items-start gap-2 py-3 border-t border-gray-100">
                <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                {fullAddress ? (
                  mapsUrl ? (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-[#4A6FFF] hover:underline leading-relaxed">
                      {fullAddress}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500 leading-relaxed">{fullAddress}</span>
                  )
                ) : (
                  <span className="text-sm text-gray-400 italic">+ Add Address</span>
                )}
              </div>
            </div>

            {/* Notes card */}
            <div className="bg-white rounded-xl p-5" style={CARD_SHADOW}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notes</h2>
              <textarea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Visible to your team only..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="mt-2 bg-[#0D1117] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#374151] disabled:opacity-60 transition-colors"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>

            {/* Activity — mobile only (shows below notes) */}
            <div className="lg:hidden bg-white rounded-xl p-5" style={CARD_SHADOW}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Activity</h2>
              <ActivityTimeline activity={sortedActivity} />
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">

            {/* Action card */}
            <div className="bg-white rounded-xl p-5" style={CARD_SHADOW}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Job Actions</h2>

              {isComplete ? (
                <button
                  disabled
                  className="w-full h-14 rounded-lg border-2 border-[#16A34A] text-[#16A34A] font-semibold flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
                >
                  <CheckCircle size={18} /> Completed
                </button>
              ) : canComplete ? (
                <div className="space-y-2">
                  <button
                    onClick={() => (completeBlocked ? null : setShowComplete(true))}
                    disabled={transitioning || completeBlocked}
                    className={`w-full h-14 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
                      completeBlocked
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#16A34A] hover:bg-[#15803D]"
                    }`}
                  >
                    <CheckCircle size={18} /> Mark Complete
                  </button>
                  {completeBlocked && (
                    <button
                      onClick={() => setShowEarlyOverride(true)}
                      className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center"
                    >
                      Finished early? Complete anyway
                    </button>
                  )}
                </div>
              ) : isScheduled ? (
                <button
                  onClick={() => transition("in_progress")}
                  disabled={transitioning}
                  className="w-full h-14 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  ▶ Start Job
                </button>
              ) : null}
            </div>

            {/* Payment card */}
            <div className="bg-white rounded-xl p-5" style={CARD_SHADOW}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h2>

              {isPaid ? (
                <div className="flex items-center gap-2 text-[#15803D] font-bold text-sm">
                  <CheckCircle size={16} />
                  Paid — ${job.payment!.amount.toLocaleString()}
                </div>
              ) : isLinkSent ? (
                <div className="flex items-center gap-2 text-[#B45309] text-sm">
                  <Clock size={14} />
                  Link sent
                  {job.invoice?.status === "viewed" && (
                    <span className="text-xs text-gray-400 ml-1">(viewed)</span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm text-gray-400">Not sent yet</span>
                  {isComplete && (
                    <button
                      onClick={sendPaymentLink}
                      disabled={sendingPayment}
                      className="w-full bg-[#0D1117] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151] disabled:opacity-60 transition-colors"
                    >
                      {sendingPayment ? "Sending..." : "Send Payment Link"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Review Request card */}
            <div className="bg-white rounded-xl p-5" style={CARD_SHADOW}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Review Request</h2>
              {!isComplete ? (
                <p className="text-sm text-gray-400">Complete this job to send a review request</p>
              ) : reviewSentAt ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#15803D] text-sm font-medium">
                    <span>✓</span>
                    <span>Sent {new Date(reviewSentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={sendReviewRequest}
                  disabled={sendingReview}
                  className="w-full border-2 border-[#0D1117] text-[#0D1117] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0D1117] hover:text-white disabled:opacity-60 transition-colors"
                >
                  {sendingReview ? "Sending…" : "⭐ Send Review Request"}
                </button>
              )}
            </div>

            {/* Activity — desktop only */}
            <div className="hidden lg:block bg-white rounded-xl p-5" style={CARD_SHADOW}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Activity</h2>
              <ActivityTimeline activity={sortedActivity} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action button — mobile only */}
      {!isComplete && (canComplete || isScheduled) && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-200 shadow-lg">
          {canComplete ? (
            <button
              onClick={() => setShowComplete(true)}
              disabled={transitioning}
              className="w-full h-14 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <CheckCircle size={18} /> Mark Complete
            </button>
          ) : (
            <button
              onClick={() => transition("in_progress")}
              disabled={transitioning}
              className="w-full h-14 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              ▶ Start Job
            </button>
          )}
        </div>
      )}

      {/* Complete modal */}
      {(showComplete || showEarlyOverride) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle size={22} className="text-green-500" />
              <h2 className="text-lg font-bold text-[#0D1117]">Mark Complete</h2>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Final Amount ($)
              </label>
              <input
                type="number"
                value={finalAmount}
                onChange={e => setFinalAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-lg font-bold focus:outline-none text-[#0D1117]"
              />
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={14} className="text-[#F59E0B] mt-0.5 shrink-0" />
              <p className="text-xs text-[#B45309]">
                This will trigger a thank-you text and review request to the customer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowComplete(false); setShowEarlyOverride(false); }}
                className="flex-1 border border-gray-200 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={complete}
                disabled={transitioning}
                className="flex-1 bg-[#16A34A] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#15803D] disabled:opacity-60 transition-colors"
              >
                {transitioning ? "Saving..." : "Confirm Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTimeline({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0) {
    return <p className="text-gray-400 text-sm">Nothing yet.</p>;
  }
  return (
    <ol className="relative pl-5 border-l-2 border-gray-100 space-y-4">
      {activity.map(entry => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-6 top-0.5 text-sm leading-none">{entry.icon}</span>
          <p className="text-sm text-[#0D1117] leading-snug">{entry.human}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtActivity(String(entry.createdAt))}</p>
        </li>
      ))}
    </ol>
  );
}
