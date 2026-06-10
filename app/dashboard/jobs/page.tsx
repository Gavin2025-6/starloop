"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, List, LayoutGrid, CheckCircle, AlertCircle } from "lucide-react";

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  serviceType: string;
  status: string;
  priority: string;
  total: number;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  customer: { name: string; phone: string | null };
  invoice?: { id: string; status: string } | null;
}

const KANBAN_COLS: { key: string; label: string; color: string }[] = [
  { key: "requested",   label: "Requested",   color: "border-blue-200 bg-blue-50" },
  { key: "scheduled",   label: "Scheduled",   color: "border-purple-200 bg-purple-50" },
  { key: "in_progress", label: "In Progress", color: "border-yellow-200 bg-yellow-50" },
  { key: "completed",   label: "Completed",   color: "border-green-200 bg-green-50" },
];

// Map column keys to status values shown in the board
// Completed column shows: completed, invoiced, paid
const COL_STATUSES: Record<string, string[]> = {
  requested:   ["requested"],
  scheduled:   ["scheduled"],
  in_progress: ["in_progress"],
  completed:   ["completed", "invoiced", "paid"],
};

const VALID_STATUS_OPTS = [
  "requested", "scheduled", "in_progress", "completed", "invoiced", "paid", "cancelled",
];

const priorityBadge = (p: string) =>
  p === "emergency" ? "bg-red-100 text-red-700" :
  p === "urgent"    ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-500";

const invoiceBadge = (status: string) =>
  status === "paid"   ? "bg-green-100 text-green-700" :
  status === "sent"   ? "bg-orange-100 text-orange-700" :
  status === "invoiced" ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-500";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  // New Job modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    newCustomerName: "",
    newCustomerPhone: "",
    useNewCustomer: false,
    serviceType: "",
    scheduledAt: "",
    notes: "",
  });
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone: string | null }>>([]);

  // Mark Complete modal
  const [completeJobId, setCompleteJobId] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState("");
  const [completing, setCompleting] = useState(false);

  // Card menu
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  useEffect(() => {
    load();
    fetch("/api/customers/list")
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/jobs/list").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setJobs(data);
    }
    setLoading(false);
  }

  async function createJob(e: React.FormEvent) {
    e.preventDefault();

    let customerId = form.customerId;

    // Create new customer if needed
    if (form.useNewCustomer) {
      if (!form.newCustomerName) return;
      const res = await fetch("/api/customers/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.newCustomerName, phone: form.newCustomerPhone }),
      });
      if (!res.ok) return;
      const c = await res.json();
      customerId = c.id;
    }

    if (!customerId) return;

    await fetch("/api/jobs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        title: form.serviceType,
        serviceType: form.serviceType,
        scheduledAt: form.scheduledAt || null,
        notes: form.notes || null,
        status: "requested",
      }),
    });

    setShowModal(false);
    setForm({
      customerId: "",
      newCustomerName: "",
      newCustomerPhone: "",
      useNewCustomer: false,
      serviceType: "",
      scheduledAt: "",
      notes: "",
    });
    load();
  }

  async function transition(jobId: string, to: string) {
    const res = await fetch(`/api/jobs/${jobId}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      alert(err.error ?? "Transition failed");
    }
    load();
  }

  async function markPaid(invoiceId: string) {
    await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: "POST" });
    setMenuOpen(null);
    load();
  }

  async function confirmComplete() {
    if (!completeJobId) return;
    setCompleting(true);
    await fetch(`/api/jobs/${completeJobId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalAmount: parseFloat(finalAmount) || 0 }),
    });
    setCompleteJobId(null);
    setFinalAmount("");
    setCompleting(false);
    load();
  }

  // Drag handlers
  function onDragStart(e: React.DragEvent, jobId: string) {
    setDraggingId(jobId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  }

  async function onDrop(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggingId) return;

    const job = jobs.find((j) => j.id === draggingId);
    if (!job) return;

    // Determine target status
    const targetStatus = colKey; // for non-completed cols, status = colKey
    // For completed column, the status to transition to depends on current state
    let to: string;
    if (colKey === "completed") {
      if (job.status === "in_progress") {
        // Trigger the complete flow
        setCompleteJobId(job.id);
        setFinalAmount(String(job.total));
        setDraggingId(null);
        return;
      }
      to = "completed";
    } else {
      to = targetStatus;
    }

    // Don't transition if already in that status/col
    const currentCol = KANBAN_COLS.find((c) => COL_STATUSES[c.key].includes(job.status))?.key;
    if (currentCol === colKey) {
      setDraggingId(null);
      return;
    }

    await transition(job.id, to);
    setDraggingId(null);
  }

  function onDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
  }

  const colJobs = (colKey: string) =>
    jobs.filter((j) => COL_STATUSES[colKey].includes(j.status));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1117]">Jobs</h1>
          <p className="text-gray-400 text-sm mt-0.5">{jobs.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-2 text-sm ${view === "kanban" ? "bg-[#1a2744] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-2 text-sm ${view === "list" ? "bg-[#1a2744] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <List size={15} />
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#f97316] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600"
          >
            <Plus size={15} /> New Job
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300 text-sm p-8">Loading...</div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-4 gap-4">
          {KANBAN_COLS.map((col) => (
            <div
              key={col.key}
              className={`rounded-xl border-2 ${col.color} p-3 min-h-[400px] transition-all ${dragOverCol === col.key ? "ring-2 ring-[#f97316] ring-offset-1" : ""}`}
              onDragOver={(e) => onDragOver(e, col.key)}
              onDrop={(e) => onDrop(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  {col.label}
                </span>
                <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">
                  {colJobs(col.key).length}
                </span>
              </div>
              <div className="space-y-2">
                {colJobs(col.key).map((job) => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, job.id)}
                    onDragEnd={onDragEnd}
                    className={`bg-white rounded-xl p-3 shadow-sm border border-white/80 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggingId === job.id ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-xs font-mono text-gray-400">{job.jobNumber}</span>
                      <div className="flex items-center gap-1 relative">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityBadge(job.priority)}`}>
                          {job.priority}
                        </span>
                        {/* Card menu */}
                        <button
                          onClick={() => setMenuOpen(menuOpen === job.id ? null : job.id)}
                          className="text-gray-400 hover:text-gray-600 px-1 text-lg leading-none"
                        >
                          ⋮
                        </button>
                        {menuOpen === job.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-6 z-20 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[140px] py-1"
                          >
                            {job.invoice && (job.invoice.status === "sent" || job.invoice.status === "invoiced") && (
                              <button
                                onClick={() => markPaid(job.invoice!.id)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50"
                              >
                                Mark Paid
                              </button>
                            )}
                            {job.status === "in_progress" && (
                              <button
                                onClick={() => {
                                  setMenuOpen(null);
                                  setCompleteJobId(job.id);
                                  setFinalAmount(String(job.total));
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-[#0d1117] hover:bg-gray-50"
                              >
                                Mark Complete
                              </button>
                            )}
                            {!job.invoice && job.status === "completed" && (
                              <button
                                onClick={() => {
                                  setMenuOpen(null);
                                  setCompleteJobId(job.id);
                                  setFinalAmount(String(job.total));
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-[#0d1117] hover:bg-gray-50"
                              >
                                Send Invoice
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-[#0d1117] mb-0.5">{job.customer.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{job.serviceType}</p>

                    {job.scheduledAt && (
                      <p className="text-xs text-gray-400 mb-2">
                        {new Date(job.scheduledAt).toLocaleDateString()}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#0d1117]">${job.total}</span>
                      <div className="flex items-center gap-1">
                        {/* Invoice status badge on Completed cards */}
                        {col.key === "completed" && job.invoice && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${invoiceBadge(job.invoice.status)}`}>
                            {job.invoice.status === "paid" ? "Paid" : "Invoiced"}
                          </span>
                        )}
                        {/* Quick action button */}
                        {col.key !== "completed" && (
                          <button
                            onClick={() => {
                              if (col.key === "in_progress") {
                                setCompleteJobId(job.id);
                                setFinalAmount(String(job.total));
                              } else {
                                const colIdx = KANBAN_COLS.findIndex((c) => c.key === col.key);
                                const nextCol = KANBAN_COLS[colIdx + 1];
                                if (nextCol) transition(job.id, nextCol.key);
                              }
                            }}
                            className="text-xs bg-[#1a2744] text-white px-2 py-1 rounded-lg hover:bg-[#243460]"
                          >
                            {col.key === "in_progress" ? "Complete" : "→ Next"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Job #", "Customer", "Service", "Status", "Priority", "Amount", "Scheduled"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No jobs yet. Create your first job!
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{job.jobNumber}</td>
                    <td className="px-4 py-3 font-medium text-[#0d1117]">{job.customer.name}</td>
                    <td className="px-4 py-3 text-gray-600">{job.serviceType}</td>
                    <td className="px-4 py-3">
                      <select
                        value={job.status}
                        onChange={(e) => transition(job.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-full font-medium border border-gray-200 cursor-pointer bg-white"
                      >
                        {VALID_STATUS_OPTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityBadge(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">${job.total}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0d1117]">New Job</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ×
              </button>
            </div>
            <form onSubmit={createJob} className="space-y-4">
              {/* Customer */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Customer *
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, useNewCustomer: false }))}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!form.useNewCustomer ? "border-[#1a2744] bg-[#1a2744] text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, useNewCustomer: true }))}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${form.useNewCustomer ? "border-[#1a2744] bg-[#1a2744] text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    + New Customer
                  </button>
                </div>
                {!form.useNewCustomer ? (
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                    required={!form.useNewCustomer}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `· ${c.phone}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Customer name *"
                      value={form.newCustomerName}
                      onChange={(e) => setForm((f) => ({ ...f, newCustomerName: e.target.value }))}
                      required={form.useNewCustomer}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={form.newCustomerPhone}
                      onChange={(e) => setForm((f) => ({ ...f, newCustomerPhone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Service Type *
                </label>
                <input
                  type="text"
                  value={form.serviceType}
                  onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                  required
                  placeholder="e.g. Water heater replacement"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>

              {/* Scheduled Time */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#f97316] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600"
                >
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Complete / Amount Confirmation Modal */}
      {completeJobId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <CheckCircle size={24} className="text-green-500" />
              <h2 className="text-lg font-bold text-[#0d1117]">Confirm Final Amount</h2>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Final Amount ($)
              </label>
              <input
                type="number"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-lg font-bold focus:outline-none text-[#0d1117]"
              />
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={14} className="text-[#f97316] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#f97316]">
                This will create an invoice and send an SMS to the customer.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setCompleteJobId(null); setFinalAmount(""); }}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmComplete}
                disabled={completing}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-60"
              >
                {completing ? "Sending..." : "Confirm & Send Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
