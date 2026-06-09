"use client";

import { useEffect, useState, useRef } from "react";
import { UserPlus, RefreshCw, Download } from "lucide-react";

interface Customer {
  id: string; name: string; phone: string | null; email: string | null;
  lastServiceDate: string | null; totalSpend: number; status: string;
}
interface PreviewRow { name: string; phone: string; email: string; lastServiceDate: string; totalSpend: string; }

const tabs = ["All", "Need Recovery", "Active"] as const;
type Tab = (typeof tabs)[number];

const TEMPLATE_CSV = "name,phone,email,lastServiceDate,totalSpend\nJohn Smith,+14165550001,john@email.com,2025-12-15,450\nJane Doe,+14165550002,jane@email.com,2025-10-20,820\nBob Lee,+14165550003,,2025-08-10,1200";

function daysSince(date: string | null): string {
  if (!date) return "—";
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  return `${d}d ago`;
}
function statusCls(s: string) {
  if (s === "active") return "bg-green-100 text-green-700";
  if (s === "at-risk") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");
  const [analyzing, setAnalyzing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", lastServiceDate: "", totalSpend: "" });
  const [csvRaw, setCsvRaw] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    // Fetch customers via analyze then reload — we use a direct customers list endpoint
    const res = await fetch("/api/customers/list").catch(() => null);
    if (res?.ok) { const d = await res.json(); setCustomers(d); }
    setLoading(false);
  }

  async function analyze() {
    setAnalyzing(true);
    const res = await fetch("/api/customers/analyze", { method: "POST" });
    const d = await res.json();
    setAnalyzing(false);
    // Reload list
    const r2 = await fetch("/api/customers/list").catch(() => null);
    if (r2?.ok) setCustomers(await r2.json());
    alert(`Analysis complete: ${d.active} active, ${d.atRisk} at-risk, ${d.lost} lost`);
  }

  function parseCsv(text: string) {
    setCsvRaw(text);
    const lines = text.trim().split("\n").slice(1, 6);
    setPreview(lines.map((l) => {
      const [name="",phone="",email="",lastServiceDate="",totalSpend=""] = l.split(",").map((c) => c.trim());
      return { name, phone, email, lastServiceDate, totalSpend };
    }));
  }

  function handleFile(file: File) { const r = new FileReader(); r.onload = (e) => parseCsv(e.target?.result as string); r.readAsText(file); }

  async function doImport() {
    if (!csvRaw) return;
    setImporting(true); setImportMsg("");
    const res = await fetch("/api/customers/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvRaw }),
    });
    const d = await res.json();
    setImportMsg(`✓ Imported ${d.imported} customers`);
    setImporting(false);
    setCsvRaw(""); setPreview([]);
    setTimeout(() => { setShowImport(false); setImportMsg(""); load(); }, 1500);
  }

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/customers/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowAdd(false);
    setForm({ name:"",phone:"",email:"",lastServiceDate:"",totalSpend:"" });
    load();
  }

  function downloadTemplate() {
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(TEMPLATE_CSV);
    a.download = "customers-template.csv"; a.click();
  }

  const filtered = tab === "All" ? customers
    : tab === "Need Recovery" ? customers.filter((c) => c.status === "at-risk" || c.status === "lost")
    : customers.filter((c) => c.status === "active");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1117]">Customers</h1>
          <p className="text-gray-400 text-sm mt-0.5">{customers.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={analyze} disabled={analyzing}
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
            <RefreshCw size={14} className={analyzing ? "animate-spin" : ""} />
            {analyzing ? "Analyzing..." : "Re-analyze"}
          </button>
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Download size={14} /> Import CSV
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#1a2744] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243460]">
            <UserPlus size={14} /> Add Customer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-white text-[#0d1117] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t} {t !== "All" && customers.length > 0 && (
              <span className="ml-1 text-xs text-gray-400">
                ({t === "Need Recovery" ? customers.filter((c) => c.status === "at-risk" || c.status === "lost").length
                  : customers.filter((c) => c.status === "active").length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Name","Phone","Last Service","Spent","Status","Action"].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-medium text-gray-400 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-300">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                {tab === "All" ? "No customers yet — import a CSV or add manually." : `No ${tab.toLowerCase()} customers.`}
              </td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-[#0d1117]">{c.name}</td>
                <td className="px-5 py-3 text-gray-500">{c.phone ?? "—"}</td>
                <td className="px-5 py-3 text-gray-500">{daysSince(c.lastServiceDate)}</td>
                <td className="px-5 py-3 text-gray-700">${c.totalSpend.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusCls(c.status)}`}>{c.status}</span>
                </td>
                <td className="px-5 py-3">
                  {(c.status === "at-risk" || c.status === "lost") && (
                    <span className="text-xs text-[#f97316] font-medium">↩ Needs recovery</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0d1117]">Import Customers</h2>
              <button onClick={() => { setShowImport(false); setCsvRaw(""); setPreview([]); setImportMsg(""); }}
                className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <button onClick={downloadTemplate}
              className="flex items-center gap-2 text-xs text-[#1a2744] border border-[#1a2744]/20 rounded-lg px-3 py-2 mb-4 hover:bg-blue-50 transition-colors">
              <Download size={12} /> Download CSV Template
            </button>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${dragging ? "border-[#1a2744] bg-blue-50" : "border-gray-200 hover:border-[#1a2744]/40"}`}
            >
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm font-medium text-gray-600">{csvRaw ? "✓ File loaded — ready to import" : "Drop CSV here or click to upload"}</p>
              <p className="text-xs text-gray-400 mt-1">name, phone, email, lastServiceDate, totalSpend</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            {/* Preview table */}
            {preview.length > 0 && (
              <div className="mb-4 overflow-x-auto rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-400 px-3 pt-2">Preview (first 5 rows)</p>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    {["Name","Phone","Last Service","Spend"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{preview.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 text-gray-500">{r.phone || "—"}</td>
                      <td className="px-3 py-2 text-gray-500">{r.lastServiceDate || "—"}</td>
                      <td className="px-3 py-2 text-gray-500">${r.totalSpend || "0"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {importMsg && <p className="text-green-600 text-sm font-medium mb-3">{importMsg}</p>}

            <div className="flex gap-2">
              <button onClick={() => { setShowImport(false); setCsvRaw(""); setPreview([]); }}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={doImport} disabled={!csvRaw || importing}
                className="flex-1 bg-[#1a2744] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#243460] disabled:opacity-60">
                {importing ? "Importing..." : `Import ${preview.length > 0 ? "Customers" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add customer modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Customer</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={addCustomer} className="space-y-3">
              {([
                { k: "name", label: "Name *", type: "text" },
                { k: "phone", label: "Phone", type: "tel" },
                { k: "email", label: "Email", type: "email" },
                { k: "lastServiceDate", label: "Last Service Date", type: "date" },
                { k: "totalSpend", label: "Total Spend ($)", type: "number" },
              ] as { k: keyof typeof form; label: string; type: string }[]).map(({ k, label, type }) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                  <input type={type} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                    required={k === "name"}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20" />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-[#1a2744] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#243460]">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
