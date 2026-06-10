"use client";

import { useEffect, useState } from "react";
import { Plus, List, LayoutGrid, CheckCircle, AlertCircle } from "lucide-react";

interface Job {
  id: string; jobNumber: string; title: string; serviceType: string;
  status: string; priority: string; total: number; scheduledAt: string | null;
  completedAt: string | null; createdAt: string;
  customer: { name: string; phone: string | null };
}

const KANBAN_COLS = [
  { key: "quoted",      label: "Quoted",      color: "border-blue-200 bg-blue-50" },
  { key: "scheduled",   label: "Scheduled",   color: "border-purple-200 bg-purple-50" },
  { key: "in_progress", label: "In Progress", color: "border-yellow-200 bg-yellow-50" },
  { key: "completed",   label: "Completed",   color: "border-green-200 bg-green-50" },
];

const STATUS_OPTS = ["requested","quoted","confirmed","scheduled","in_progress","completed","invoiced","paid","cancelled"];

const priorityBadge = (p: string) =>
  p === "emergency" ? "bg-red-100 text-red-700" :
  p === "urgent"    ? "bg-orange-100 text-orange-700" :
  "bg-gray-100 text-gray-500";

const statusBadge = (s: string) =>
  s === "completed" || s === "paid" ? "bg-green-100 text-green-700" :
  s === "in_progress" ? "bg-yellow-100 text-yellow-700" :
  s === "cancelled"   ? "bg-red-100 text-red-700" :
  "bg-blue-100 text-blue-700";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerId: "", serviceType: "", description: "", priority: "normal", address: "", scheduledAt: "" });
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone: string | null }>>([]);
  const [aiTiers, setAiTiers] = useState<Array<{ name: string; total: number }>>([]);
  const [quoting, setQuoting] = useState(false);
  const [completeJobId, setCompleteJobId] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState("");

  useEffect(() => {
    load();
    fetch("/api/customers/list").then((r) => r.json()).then(setCustomers).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/jobs/list").catch(() => null);
    if (res?.ok) setJobs(await res.json());
    setLoading(false);
  }

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/jobs/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, title: form.serviceType }),
    });
    setShowModal(false);
    setForm({ customerId: "", serviceType: "", description: "", priority: "normal", address: "", scheduledAt: "" });
    load();
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
    await fetch(`/api/jobs/${completeJobId}/complete`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalAmount: parseFloat(finalAmount) || 0 }),
    });
    setCompleteJobId(null);
    load();
  }

  async function getAiQuote() {
    if (!form.serviceType) return;
    setQuoting(true);
    const res = await fetch("/api/jobs/quote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType: form.serviceType }),
    });
    const d = await res.json();
    setAiTiers(d.tiers || []);
    setQuoting(false);
  }

  const kanbanJobs = (colKey: string) => jobs.filter((j) => j.status === colKey);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1117]">Jobs</h1>
          <p className="text-gray-400 text-sm mt-0.5">{jobs.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setView("kanban")} className={`px-3 py-2 text-sm ${view === "kanban" ? "bg-[#1a2744] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView("list")} className={`px-3 py-2 text-sm ${view === "list" ? "bg-[#1a2744] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              <List size={15} />
            </button>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#f97316] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600">
            <Plus size={15} /> New Job
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300 text-sm p-8">Loading...</div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-4 gap-4">
          {KANBAN_COLS.map((col) => (
            <div key={col.key} className={`rounded-xl border-2 ${col.color} p-3 min-h-[400px]`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{col.label}</span>
                <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">{kanbanJobs(col.key).length}</span>
              </div>
              <div className="space-y-2">
                {kanbanJobs(col.key).map((job) => (
                  <div key={job.id} className="bg-white rounded-xl p-3 shadow-sm border border-white/80 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-xs font-mono text-gray-400">{job.jobNumber}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityBadge(job.priority)}`}>{job.priority}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#0d1117] mb-0.5">{job.customer.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{job.serviceType}</p>
                    {job.scheduledAt && (
                      <p className="text-xs text-gray-400 mb-2">{new Date(job.scheduledAt).toLocaleDateString()}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#0d1117]">${job.total}</span>
                      {col.key !== "completed" && (
                        <button
                          onClick={() => col.key === "in_progress" ? (setCompleteJobId(job.id), setFinalAmount(String(job.total))) : updateStatus(job.id, KANBAN_COLS[KANBAN_COLS.findIndex((c) => c.key === col.key) + 1]?.key || col.key)}
                          className="text-xs bg-[#1a2744] text-white px-2 py-1 rounded-lg hover:bg-[#243460]">
                          {col.key === "in_progress" ? "Complete" : "→ Next"}
                        </button>
                      )}
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
                {["Job #","Customer","Service","Status","Priority","Amount","Scheduled"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jobs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No jobs yet. Create your first job!</td></tr>
              ) : jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{job.jobNumber}</td>
                  <td className="px-4 py-3 font-medium text-[#0d1117]">{job.customer.name}</td>
                  <td className="px-4 py-3 text-gray-600">{job.serviceType}</td>
                  <td className="px-4 py-3">
                    <select value={job.status} onChange={(e) => updateStatus(job.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusBadge(job.status)}`}>
                      {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityBadge(job.priority)}`}>{job.priority}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">${job.total}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
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
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={createJob} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Customer *</label>
                <select value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white">
                  <option value="">Select customer...</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Service Type *</label>
                <input type="text" value={form.serviceType} onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))} required
                  placeholder="e.g. Water heater replacement"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Scheduled At</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none" />
              </div>

              {/* AI Quote */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">AI Quote Suggestion</span>
                  <button type="button" onClick={getAiQuote} disabled={quoting || !form.serviceType}
                    className="text-xs bg-[#1a2744] text-white px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-[#243460]">
                    {quoting ? "Generating..." : "✨ Get AI Quote"}
                  </button>
                </div>
                {aiTiers.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {aiTiers.map((tier) => (
                      <button type="button" key={tier.name}
                        onClick={() => setForm((f) => ({ ...f, description: f.description || tier.name }))}
                        className="text-center border border-gray-200 bg-white rounded-lg p-2 hover:border-[#f97316] transition-colors">
                        <div className="text-xs font-medium text-gray-600">{tier.name}</div>
                        <div className="text-sm font-bold text-[#0d1117]">${tier.total}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-[#f97316] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600">Create Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Job Modal */}
      {completeJobId && (
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
              <AlertCircle size={14} className="text-[#f97316] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#f97316]">This will trigger invoice + follow-up SMS to the customer.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCompleteJobId(null)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={completeJob}
                className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-600">Confirm Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
