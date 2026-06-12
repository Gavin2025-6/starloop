"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle, AlertCircle, Search, X } from "lucide-react";

interface Job {
  id: string; jobNumber: string; title: string; serviceType: string;
  status: string; priority: string; total: number; scheduledAt: string | null;
  completedAt: string | null; createdAt: string;
  customer: { name: string; phone: string | null };
}

interface Customer { id: string; name: string; phone: string | null; }

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  scheduled:   { label: "Scheduled",   bg: "bg-[#EFF6FF]",  text: "text-[#1D4ED8]"  },
  in_progress: { label: "In Progress", bg: "bg-[#FFFBEB]",  text: "text-[#B45309]"  },
  completed:   { label: "Complete",    bg: "bg-[#F0FDF4]",  text: "text-[#15803D]"  },
  requested:   { label: "Requested",   bg: "bg-gray-100",   text: "text-gray-600"   },
  invoiced:    { label: "Invoiced",    bg: "bg-teal-50",    text: "text-teal-700"   },
  paid:        { label: "Paid",        bg: "bg-emerald-50", text: "text-emerald-700"},
  cancelled:   { label: "Cancelled",   bg: "bg-red-50",     text: "text-red-700"    },
};

function fmtDateTime(d: string | null) {
  if (!d) return "Not scheduled";
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function isToday(d: string | null) {
  if (!d) return false;
  const dt = new Date(d), now = new Date();
  return dt.getFullYear() === now.getFullYear() &&
         dt.getMonth() === now.getMonth() &&
         dt.getDate() === now.getDate();
}

function isThisMonth(d: string | null) {
  if (!d) return false;
  const dt = new Date(d), now = new Date();
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
}

type FilterTab = "all" | "today" | "scheduled" | "in_progress" | "complete";

const TABS: Array<{ key: FilterTab; label: string }> = [
  { key: "all",         label: "All" },
  { key: "today",       label: "Today" },
  { key: "scheduled",   label: "Scheduled" },
  { key: "in_progress", label: "In Progress" },
  { key: "complete",    label: "Complete" },
];

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // New job modal
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);

  // Step 1 — customer
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCust, setShowNewCust] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "" });

  // Step 2 — job details
  const [jobForm, setJobForm] = useState({
    serviceType: "", total: "", date: "", time: "", priority: "normal", address: "",
  });

  // Complete job modal
  const [completeJobId, setCompleteJobId] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    load();
    fetch("/api/customers/list").then(r => r.json()).then(setCustomers).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/jobs/list").catch(() => null);
    if (res?.ok) setJobs(await res.json());
    setLoading(false);
  }

  async function updateStatus(jobId: string, status: string) {
    await fetch(`/api/jobs/${jobId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function completeJob() {
    if (!completeJobId) return;
    setCompleting(true);
    await fetch(`/api/jobs/${completeJobId}/complete`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalAmount: parseFloat(finalAmount) || 0 }),
    });
    setCompleteJobId(null);
    setCompleting(false);
    load();
  }

  async function createJob() {
    let customerId = selectedCustomer?.id ?? "";
    if (showNewCust) {
      const res = await fetch("/api/customers/add", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCust.name, phone: newCust.phone || null }),
      });
      const created = await res.json();
      customerId = created.id;
    }
    const scheduledAt =
      jobForm.date && jobForm.time ? `${jobForm.date}T${jobForm.time}` :
      jobForm.date ? `${jobForm.date}T00:00` : null;

    await fetch("/api/jobs/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        serviceType: jobForm.serviceType,
        title: jobForm.serviceType,
        priority: jobForm.priority,
        address: jobForm.address || null,
        scheduledAt,
        total: parseFloat(jobForm.total) || 0,
      }),
    });
    closeModal();
    load();
  }

  function openModal() {
    setShowModal(true);
    setModalStep(1);
    setSelectedCustomer(null);
    setCustSearch("");
    setShowNewCust(false);
    setNewCust({ name: "", phone: "" });
    setJobForm({ serviceType: "", total: "", date: "", time: "", priority: "normal", address: "" });
  }

  function closeModal() {
    setShowModal(false);
    setModalStep(1);
  }

  const filteredCusts = useMemo(() => {
    if (!custSearch.trim()) return customers.slice(0, 8);
    const q = custSearch.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    ).slice(0, 8);
  }, [customers, custSearch]);

  const scheduledCount = jobs.filter(j => j.status === "scheduled").length;
  const inProgressCount = jobs.filter(j => j.status === "in_progress").length;
  const completeCount = jobs.filter(
    j => ["completed", "invoiced", "paid"].includes(j.status) && isThisMonth(j.completedAt ?? j.createdAt)
  ).length;

  const filteredJobs = useMemo(() => {
    switch (activeTab) {
      case "today":       return jobs.filter(j => isToday(j.scheduledAt));
      case "scheduled":   return jobs.filter(j => j.status === "scheduled");
      case "in_progress": return jobs.filter(j => j.status === "in_progress");
      case "complete":    return jobs.filter(j => ["completed","invoiced","paid"].includes(j.status));
      default:            return jobs;
    }
  }, [jobs, activeTab]);

  function handleCardAction(e: React.MouseEvent, job: Job) {
    e.stopPropagation();
    if (job.status === "scheduled" || job.status === "requested") {
      updateStatus(job.id, "in_progress");
    } else if (job.status === "in_progress") {
      setCompleteJobId(job.id);
      setFinalAmount(String(job.total));
    } else {
      router.push(`/dashboard/jobs/${job.id}`);
    }
  }

  function getActionBtn(status: string) {
    if (status === "scheduled" || status === "requested")
      return { label: "Start Job",      cls: "bg-[#F59E0B] text-white hover:bg-[#D97706]" };
    if (status === "in_progress")
      return { label: "Mark Complete",  cls: "bg-[#16A34A] text-white hover:bg-[#15803D]" };
    return   { label: "View Details",   cls: "bg-gray-100 text-gray-600 hover:bg-gray-200"  };
  }

  const step1Valid = selectedCustomer !== null || (showNewCust && newCust.name.trim() && newCust.phone.trim());
  const step2Valid = jobForm.serviceType.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-[#0D1117]" style={{ fontFamily: "'Inter', sans-serif" }}>Jobs</h1>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-[#0D1117] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151] transition-colors"
          >
            <Plus size={15} /> New Job
          </button>
        </div>

        {/* Summary bar */}
        <div className="bg-gray-100 rounded-xl px-4 py-3 mb-5 flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-gray-500">
          <span><span className="font-semibold text-[#1D4ED8]">{scheduledCount}</span> Scheduled</span>
          <span className="text-gray-300">·</span>
          <span><span className="font-semibold text-[#B45309]">{inProgressCount}</span> In Progress</span>
          <span className="text-gray-300">·</span>
          <span><span className="font-semibold text-[#15803D]">{completeCount}</span> Complete this month</span>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-gray-200 mb-5 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab.key
                  ? "font-bold text-[#0D1117] border-b-2 border-[#0D1117] -mb-px"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Job cards */}
        {loading ? (
          <div className="text-gray-400 text-sm text-center py-16">Loading...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-16">
            {activeTab === "all" ? "No jobs yet. Create your first job!" : "No jobs match this filter."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredJobs.map(job => {
              const sc = STATUS_CFG[job.status] ?? { label: job.status, bg: "bg-gray-100", text: "text-gray-600" };
              const btn = getActionBtn(job.status);
              return (
                <div
                  key={job.id}
                  onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                  className="bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)", borderRadius: "12px" }}
                >
                  {/* Row 1: Customer + Amount */}
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[18px] font-bold text-[#0D1117] leading-tight">{job.customer.name}</span>
                    <span className="text-[18px] font-bold text-[#0D1117] ml-3 shrink-0">${job.total.toLocaleString()}</span>
                  </div>

                  {/* Row 2: Service description */}
                  <p className="text-[14px] text-gray-500 mb-3">{job.serviceType}</p>

                  {/* Row 3: Date + Status badge */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="text-[14px] text-gray-400 flex items-center gap-1.5">
                      <span>📅</span>
                      {fmtDateTime(job.scheduledAt)}
                    </span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${sc.bg} ${sc.text}`}
                      style={{ borderRadius: "20px" }}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Row 4: Action button */}
                  <div className="sm:flex sm:justify-end">
                    <button
                      onClick={e => handleCardAction(e, job)}
                      className={`w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${btn.cls}`}
                      style={{ borderRadius: "8px" }}
                    >
                      {btn.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3-Step New Job Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div
            className="bg-white w-full sm:max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: "16px 16px 0 0" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold text-[#0D1117]">New Job</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Step progress */}
            <div className="flex items-center gap-2 px-6 pb-5">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step < modalStep  ? "bg-[#10B981] text-white" :
                    step === modalStep ? "bg-[#0D1117] text-white" :
                                        "bg-gray-100 text-gray-400"
                  }`}>
                    {step < modalStep ? "✓" : step}
                  </div>
                  {step < 3 && (
                    <div className={`h-px w-8 transition-colors ${step < modalStep ? "bg-[#10B981]" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
              <span className="text-xs text-gray-400 ml-2">
                {modalStep === 1 ? "Customer" : modalStep === 2 ? "Job Details" : "Confirm"}
              </span>
            </div>

            <div className="px-6 pb-8 space-y-4">

              {/* ── Step 1: Customer ── */}
              {modalStep === 1 && (
                <>
                  {!showNewCust ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Search Customer</label>
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={custSearch}
                            onChange={e => { setCustSearch(e.target.value); setSelectedCustomer(null); }}
                            placeholder="Name or phone number..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                          />
                        </div>
                      </div>

                      {selectedCustomer ? (
                        <div className="p-3 bg-[#F0FDF4] border border-green-200 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold text-[#0D1117]">{selectedCustomer.name}</span>
                            {selectedCustomer.phone && (
                              <span className="text-xs text-gray-500 ml-2">{selectedCustomer.phone}</span>
                            )}
                          </div>
                          <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={14} />
                          </button>
                        </div>
                      ) : custSearch.trim() && filteredCusts.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          {filteredCusts.map(c => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedCustomer(c); setCustSearch(""); }}
                              className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                            >
                              <span className="text-sm font-medium text-[#0D1117]">{c.name}</span>
                              {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <button
                        onClick={() => { setShowNewCust(true); setSelectedCustomer(null); setCustSearch(""); }}
                        className="text-sm text-[#4A6FFF] hover:underline font-medium"
                      >
                        + New Customer
                      </button>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#0D1117]">New Customer</span>
                        <button
                          onClick={() => setShowNewCust(false)}
                          className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                          Cancel
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name *</label>
                        <input
                          type="text"
                          value={newCust.name}
                          onChange={e => setNewCust(n => ({ ...n, name: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={newCust.phone}
                          onChange={e => setNewCust(n => ({ ...n, phone: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setModalStep(2)}
                    disabled={!step1Valid}
                    className="w-full bg-[#0D1117] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#374151] disabled:opacity-40 transition-colors mt-2"
                  >
                    Next →
                  </button>
                </>
              )}

              {/* ── Step 2: Job Details ── */}
              {modalStep === 2 && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Service Description *
                    </label>
                    <textarea
                      rows={3}
                      value={jobForm.serviceType}
                      onChange={e => setJobForm(f => ({ ...f, serviceType: e.target.value }))}
                      placeholder="e.g. Weekly lawn mowing"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={jobForm.total}
                        onChange={e => setJobForm(f => ({ ...f, total: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                      <input
                        type="date"
                        value={jobForm.date}
                        onChange={e => setJobForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Time</label>
                      <input
                        type="time"
                        value={jobForm.time}
                        onChange={e => setJobForm(f => ({ ...f, time: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setModalStep(1)}
                      className="flex-1 border border-gray-200 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setModalStep(3)}
                      disabled={!step2Valid}
                      className="flex-1 bg-[#0D1117] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#374151] disabled:opacity-40 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </>
              )}

              {/* ── Step 3: Confirm ── */}
              {modalStep === 3 && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-semibold text-[#0D1117]">
                        {selectedCustomer?.name ?? newCust.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm gap-4">
                      <span className="text-gray-500 shrink-0">Service</span>
                      <span className="font-semibold text-[#0D1117] text-right">{jobForm.serviceType}</span>
                    </div>
                    {jobForm.total && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-semibold text-[#0D1117]">${parseFloat(jobForm.total).toFixed(2)}</span>
                      </div>
                    )}
                    {(jobForm.date || jobForm.time) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Scheduled</span>
                        <span className="font-semibold text-[#0D1117]">
                          {jobForm.date && new Date(jobForm.date + "T12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {jobForm.time && ` at ${jobForm.time}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={createJob}
                    className="w-full bg-[#0D1117] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#374151] transition-colors"
                  >
                    Create Job
                  </button>
                  <button
                    onClick={() => setModalStep(2)}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 text-center"
                  >
                    ← Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Complete Job Modal ── */}
      {completeJobId && (
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
              <p className="text-xs text-[#B45309]">This will trigger invoice + follow-up SMS to the customer.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCompleteJobId(null)}
                className="flex-1 border border-gray-200 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={completeJob}
                disabled={completing}
                className="flex-1 bg-[#16A34A] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#15803D] disabled:opacity-60 transition-colors"
              >
                {completing ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
