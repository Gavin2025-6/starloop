"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, List, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface JobEvent {
  id: string;
  jobNumber: string;
  title: string;
  scheduledAt: string;
  status: string;
  customer: { name: string };
}

interface TimeOffEntry {
  id: string;
  date: string;
  allDay: boolean;
  reason?: string;
}

type ViewMode = "month" | "week";

const STATUS_COLOR: Record<string, string> = {
  requested: "bg-blue-100 text-blue-800",
  scheduled: "bg-orange-100 text-orange-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function SchedulePage() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [jobs, setJobs] = useState<JobEvent[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOffEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addTimeOffDate, setAddTimeOffDate] = useState<Date | null>(null);
  const [timeOffReason, setTimeOffReason] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, toRes] = await Promise.all([
        fetch("/api/jobs/list"),
        fetch("/api/availability/time-off-list"),
      ]);
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (toRes.ok) setTimeOffs(await toRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build calendar grid (month view)
  function buildMonthGrid(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startOffset = first.getDay(); // 0=Sun
    const days: Date[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(new Date(year, month, 1 - (startOffset - i)));
    }
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    while (days.length % 7 !== 0) {
      days.push(new Date(year, month + 1, days.length - last.getDate() - startOffset + 1));
    }
    return days;
  }

  // Build week grid
  function buildWeekDays(date: Date): Date[] {
    const day = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }

  const days = view === "month" ? buildMonthGrid(cursor) : buildWeekDays(cursor);
  const today = new Date();

  function getJobsForDay(d: Date) {
    return jobs.filter((j) => j.scheduledAt && isSameDay(new Date(j.scheduledAt), d));
  }

  function isTimeOff(d: Date) {
    return timeOffs.some((t) => isSameDay(new Date(t.date), d) && t.allDay);
  }

  function navigate(dir: 1 | -1) {
    const next = new Date(cursor);
    if (view === "month") next.setMonth(cursor.getMonth() + dir);
    else next.setDate(cursor.getDate() + dir * 7);
    setCursor(next);
  }

  function headerLabel() {
    if (view === "month") {
      return cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    const week = buildWeekDays(cursor);
    const start = week[0].toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const end = week[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${start} – ${end}`;
  }

  async function handleAddTimeOff() {
    if (!addTimeOffDate) return;
    await fetch("/api/availability/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: addTimeOffDate.toISOString(), allDay: true, reason: timeOffReason }),
    });
    setAddTimeOffDate(null);
    setTimeOffReason("");
    fetchData();
  }

  async function handleDeleteTimeOff(id: string) {
    await fetch("/api/availability/time-off", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  const selectedJobs = selectedDate ? getJobsForDay(selectedDate) : [];
  const selectedTimeOff = selectedDate ? timeOffs.filter((t) => isSameDay(new Date(t.date), selectedDate)) : [];

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1117]">My Schedule</h1>
          <p className="text-gray-400 text-sm mt-0.5">View booked jobs and manage availability</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView("month")}
              className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${view === "month" ? "bg-[#1a2744] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              <Calendar size={14} /> Month
            </button>
            <button onClick={() => setView("week")}
              className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors border-l border-gray-200 ${view === "week" ? "bg-[#1a2744] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              <List size={14} /> Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar nav */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold text-[#0d1117] text-sm">{headerLabel()}</span>
          <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayJobs = getJobsForDay(day);
            const off = isTimeOff(day);
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const inMonth = view === "month" ? day.getMonth() === cursor.getMonth() : true;

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`min-h-[80px] p-1.5 border-b border-r border-gray-100 cursor-pointer transition-colors
                  ${off ? "bg-gray-50" : ""}
                  ${isSelected ? "bg-blue-50 ring-2 ring-inset ring-blue-200" : "hover:bg-gray-50"}
                  ${!inMonth ? "opacity-30" : ""}
                `}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1
                  ${isToday ? "bg-[#f97316] text-white" : "text-gray-600"}`}>
                  {day.getDate()}
                </div>
                {off && (
                  <span className="text-[10px] text-gray-400 block leading-tight">Day off</span>
                )}
                {dayJobs.slice(0, 2).map((j) => (
                  <div key={j.id}
                    className={`text-[10px] px-1 py-0.5 rounded mb-0.5 truncate font-medium ${STATUS_COLOR[j.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {formatTime(j.scheduledAt)} {j.customer.name}
                  </div>
                ))}
                {dayJobs.length > 2 && (
                  <span className="text-[10px] text-gray-400">+{dayJobs.length - 2} more</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-200" />Booked</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-200" />Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />Day off</span>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#0d1117]">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setAddTimeOffDate(selectedDate)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                Mark Day Off
              </button>
              <button
                onClick={() => router.push(`/dashboard/jobs?date=${selectedDate.toISOString().slice(0, 10)}`)}
                className="text-xs px-3 py-1.5 bg-[#f97316] text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
                + New Job
              </button>
            </div>
          </div>

          {selectedJobs.length === 0 && selectedTimeOff.length === 0 && (
            <p className="text-gray-400 text-sm">No jobs or time-offs on this day.</p>
          )}

          {selectedTimeOff.map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Day Off</span>
                {t.reason && <span className="text-xs text-gray-400 ml-2">— {t.reason}</span>}
              </div>
              <button onClick={() => handleDeleteTimeOff(t.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}

          {selectedJobs.map((j) => (
            <div key={j.id}
              onClick={() => router.push(`/dashboard/jobs?id=${j.id}`)}
              className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 mb-2 cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-medium text-[#0d1117]">{j.customer.name}</p>
                <p className="text-xs text-gray-400">{j.title} · {formatTime(j.scheduledAt)}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[j.status] ?? "bg-gray-100 text-gray-600"}`}>
                {j.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add time-off modal */}
      {addTimeOffDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-[#0d1117] mb-1">Mark Day Off</h3>
            <p className="text-gray-400 text-xs mb-4">
              {addTimeOffDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Reason (optional)</label>
            <input
              value={timeOffReason}
              onChange={(e) => setTimeOffReason(e.target.value)}
              placeholder="e.g. Vacation, Holiday..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/20 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setAddTimeOffDate(null); setTimeOffReason(""); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAddTimeOff}
                className="flex-1 py-2.5 bg-[#1a2744] text-white rounded-lg text-sm font-medium hover:bg-[#243460]">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-40">
          <div className="w-6 h-6 border-2 border-[#1a2744] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
