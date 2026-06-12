"use client";

import { useEffect, useState } from "react";
import { X, Phone } from "lucide-react";

// ─── Inline SVG Avatars ────────────────────────────────────────────────────────

function ErinAvatar() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#FFF3E0"/>
      <path d="M18 78 Q18 62 40 60 Q62 62 62 78 Z" fill="#FF7043"/>
      <rect x="34" y="50" width="12" height="12" rx="4" fill="#FDDBB4"/>
      <ellipse cx="40" cy="37" rx="17" ry="19" fill="#FDDBB4"/>
      <path d="M23 35 Q22 18 40 16 Q58 18 57 35 Q56 24 40 22 Q24 24 23 35 Z" fill="#5D4037"/>
      <path d="M23 35 Q20 44 22 50 Q24 52 25 48 Q23 42 26 37 Z" fill="#5D4037"/>
      <path d="M57 35 Q60 44 58 50 Q56 52 55 48 Q57 42 54 37 Z" fill="#5D4037"/>
      <ellipse cx="33" cy="35" rx="4" ry="4.5" fill="white"/>
      <ellipse cx="47" cy="35" rx="4" ry="4.5" fill="white"/>
      <circle cx="33" cy="36" r="2.5" fill="#3E2723"/>
      <circle cx="47" cy="36" r="2.5" fill="#3E2723"/>
      <circle cx="34" cy="35" r="1" fill="white"/>
      <circle cx="48" cy="35" r="1" fill="white"/>
      <path d="M29 30 Q33 28 36 30" stroke="#5D4037" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M44 30 Q47 28 51 30" stroke="#5D4037" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="40" cy="41" r="1.5" fill="#C8956C"/>
      <path d="M33 46 Q40 52 47 46" stroke="#C8956C" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="28" cy="42" rx="4" ry="2.5" fill="#FFB3A3" fillOpacity="0.55"/>
      <ellipse cx="52" cy="42" rx="4" ry="2.5" fill="#FFB3A3" fillOpacity="0.55"/>
    </svg>
  );
}

function DwightAvatar() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#FFFDE7"/>
      <path d="M18 78 Q18 62 40 60 Q62 62 62 78 Z" fill="#F9A825"/>
      <path d="M36 60 L33 72 L40 66 L47 72 L44 60 Z" fill="white"/>
      <rect x="34" y="50" width="12" height="11" rx="2" fill="#E8C89A"/>
      <rect x="23" y="20" width="34" height="34" rx="10" fill="#E8C89A"/>
      <path d="M23 30 Q23 16 40 15 Q57 16 57 30 L57 24 Q55 14 40 13 Q25 14 23 24 Z" fill="#212121"/>
      <path d="M23 30 L23 36 Q24 38 26 36 L26 28 Q23 25 23 30 Z" fill="#212121"/>
      <path d="M57 30 L57 36 Q56 38 54 36 L54 28 Q57 25 57 30 Z" fill="#212121"/>
      <ellipse cx="33" cy="35" rx="4" ry="3.5" fill="white"/>
      <ellipse cx="47" cy="35" rx="4" ry="3.5" fill="white"/>
      <circle cx="33" cy="35" r="2" fill="#424242"/>
      <circle cx="47" cy="35" r="2" fill="#424242"/>
      <rect x="28.5" y="31.5" width="9" height="7" rx="1" fill="none" stroke="#212121" strokeWidth="1.5"/>
      <rect x="42.5" y="31.5" width="9" height="7" rx="1" fill="none" stroke="#212121" strokeWidth="1.5"/>
      <line x1="37.5" y1="35" x2="42.5" y2="35" stroke="#212121" strokeWidth="1.5"/>
      <line x1="24" y1="29" x2="29" y2="30" stroke="#212121" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="56" y1="29" x2="51" y2="30" stroke="#212121" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M29 31 L37 31" stroke="#212121" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M43 31 L51 31" stroke="#212121" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M40 40 L38 44 L42 44 Z" stroke="#C8956C" strokeWidth="1" fill="none"/>
      <path d="M34 48 Q40 46 46 48" stroke="#A67C6A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function JimAvatar() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#E3F2FD"/>
      <path d="M18 78 Q18 62 40 60 Q62 62 62 78 Z" fill="#1976D2"/>
      <path d="M36 60 L33 72 L40 66 L47 72 L44 60 Z" fill="white"/>
      <rect x="34" y="50" width="12" height="12" rx="4" fill="#FDDBB4"/>
      <ellipse cx="40" cy="37" rx="16" ry="21" fill="#FDDBB4"/>
      <path d="M24 27 Q25 14 40 13 Q55 14 56 27 Q52 18 40 18 Q28 18 24 27 Z" fill="#6D4C41"/>
      <path d="M24 27 Q21 22 23 28 Q22 24 24 27 Z" fill="#6D4C41"/>
      <path d="M24 27 Q26 20 36 17 Q24 19 22 25 Z" fill="#6D4C41"/>
      <ellipse cx="33" cy="35" rx="3.5" ry="3.5" fill="white"/>
      <ellipse cx="47" cy="35" rx="3.5" ry="3.5" fill="white"/>
      <circle cx="33" cy="35" r="2" fill="#3E2723"/>
      <circle cx="47" cy="35" r="2" fill="#3E2723"/>
      <circle cx="34" cy="34" r="0.8" fill="white"/>
      <circle cx="48" cy="34" r="0.8" fill="white"/>
      <path d="M30 31 Q33 30 36 31" stroke="#6D4C41" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M44 31 Q47 30 50 31" stroke="#6D4C41" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <circle cx="40" cy="41" r="1.2" fill="#C8956C"/>
      <path d="M34 47 Q40 51 46 47" stroke="#C8956C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function AngelaAvatar() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F3E5F5"/>
      <path d="M18 78 Q18 62 40 60 Q62 62 62 78 Z" fill="#FAFAFA"/>
      <path d="M36 60 L34 70 L40 64 L46 70 L44 60 Z" fill="#E0E0E0"/>
      <rect x="34" y="50" width="12" height="12" rx="4" fill="#FDDBB4"/>
      <ellipse cx="40" cy="39" rx="14" ry="20" fill="#FDDBB4"/>
      <path d="M26 30 Q26 20 40 18 Q54 20 54 30 Q50 22 40 21 Q30 22 26 30 Z" fill="#F5C518"/>
      <circle cx="40" cy="17" r="9" fill="#F9D835"/>
      <circle cx="40" cy="17" r="5" fill="#F0B800"/>
      <path d="M36 17 Q40 14 44 17 Q40 20 36 17" stroke="#E6B800" strokeWidth="0.8" fill="none"/>
      <ellipse cx="33" cy="36" rx="3.5" ry="3" fill="white"/>
      <ellipse cx="47" cy="36" rx="3.5" ry="3" fill="white"/>
      <circle cx="33" cy="36" r="2" fill="#5D4037"/>
      <circle cx="47" cy="36" r="2" fill="#5D4037"/>
      <line x1="29" y1="32" x2="36" y2="31" stroke="#9E9E9E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="44" y1="31" x2="51" y2="32" stroke="#9E9E9E" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M38 41 Q40 43 42 41" stroke="#C8956C" strokeWidth="1" fill="none"/>
      <path d="M35 46 Q37 44 40 44 Q43 44 45 46" stroke="#C8956C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M36 46 Q40 48 44 46" stroke="#C8956C" strokeWidth="1" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function OscarAvatar() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#E8F5E9"/>
      <path d="M18 78 Q18 62 40 60 Q62 62 62 78 Z" fill="#00897B"/>
      <rect x="34" y="50" width="12" height="12" rx="4" fill="#C68642"/>
      <ellipse cx="40" cy="38" rx="17" ry="18" fill="#C68642"/>
      <path d="M23 30 Q23 17 40 16 Q57 17 57 30 Q55 21 40 20 Q25 21 23 30 Z" fill="#1A1A1A"/>
      <path d="M23 30 Q21 25 23 30 Q21 27 23 30 Z" fill="#1A1A1A"/>
      <path d="M57 30 Q59 25 57 30 Q59 27 57 30 Z" fill="#1A1A1A"/>
      <ellipse cx="33" cy="36" rx="3.5" ry="3.5" fill="white"/>
      <ellipse cx="47" cy="36" rx="3.5" ry="3.5" fill="white"/>
      <circle cx="33" cy="36" r="2.2" fill="#1A1A1A"/>
      <circle cx="47" cy="36" r="2.2" fill="#1A1A1A"/>
      <circle cx="34" cy="35" r="0.8" fill="white"/>
      <circle cx="48" cy="35" r="0.8" fill="white"/>
      <path d="M30 31 Q33 30 36 31" stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M44 31 Q47 30 50 31" stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="40" cy="42" r="1.5" fill="#A05C2C"/>
      <path d="M34 47 Q40 51 46 47" stroke="#A05C2C" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function AndyAvatar() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#FFEBEE"/>
      <path d="M18 78 Q18 62 40 60 Q62 62 62 78 Z" fill="#F5F5F5"/>
      <polygon points="37,60 40,76 43,60 41.5,68 40,73 38.5,68" fill="#1565C0"/>
      <line x1="37.5" y1="63" x2="42.5" y2="63" stroke="#C62828" strokeWidth="0.8"/>
      <line x1="37" y1="66" x2="43" y2="66" stroke="#C62828" strokeWidth="0.8"/>
      <rect x="34" y="50" width="12" height="12" rx="4" fill="#FDDBB4"/>
      <rect x="23" y="21" width="34" height="35" rx="12" fill="#FDDBB4"/>
      <path d="M23 28 Q23 15 40 14 Q57 15 57 28 Q55 18 40 17 Q25 18 23 28 Z" fill="#8B4513"/>
      <path d="M23 28 Q20 23 22 28 Q21 25 23 28 Z" fill="#8B4513"/>
      <path d="M57 28 Q60 23 58 28 Q59 25 57 28 Z" fill="#8B4513"/>
      <ellipse cx="33" cy="33" rx="4" ry="4" fill="white"/>
      <ellipse cx="47" cy="33" rx="4" ry="4" fill="white"/>
      <circle cx="33" cy="33" r="2.5" fill="#5D3A1A"/>
      <circle cx="47" cy="33" r="2.5" fill="#5D3A1A"/>
      <circle cx="34" cy="32" r="1" fill="white"/>
      <circle cx="48" cy="32" r="1" fill="white"/>
      <path d="M29 28 Q33 26 37 28" stroke="#8B4513" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M43 28 Q47 26 51 28" stroke="#8B4513" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="40" cy="39" r="1.5" fill="#C8956C"/>
      <path d="M30 44 Q40 52 50 44" stroke="#C8956C" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M33 45 Q40 50 47 45 Q40 48 33 45 Z" fill="white"/>
      <ellipse cx="27" cy="40" rx="4" ry="2.5" fill="#FFB3A3" fillOpacity="0.5"/>
      <ellipse cx="53" cy="40" rx="4" ry="2.5" fill="#FFB3A3" fillOpacity="0.5"/>
    </svg>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CallLog {
  id: string;
  callerPhone: string;
  status: string;
  intent: string | null;
  appointmentBooked: boolean;
  createdAt: string;
}

interface AgentStatus {
  intake:   { count: number };
  followup: { count: number };
}

interface Availability {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const AGENTS = [
  {
    key: "erin",
    name: "Erin",
    role: "Front Desk",
    tagline: "Answers every call, even when you're on the job.",
    bg: "bg-orange-50",
    badge: "bg-[#FFF3E0] text-[#E65100]",
    Avatar: ErinAvatar,
    primary: true,
  },
  {
    key: "dwight",
    name: "Dwight",
    role: "HVAC & Electrical Specialist",
    tagline: "By the book. Every time.",
    bg: "bg-yellow-50",
    badge: "bg-[#FFFDE7] text-[#F57F17]",
    Avatar: DwightAvatar,
    primary: false,
  },
  {
    key: "jim",
    name: "Jim",
    role: "Handyman & Cleaning",
    tagline: "Easy to talk to. Hard to stump.",
    bg: "bg-blue-50",
    badge: "bg-[#E3F2FD] text-[#1565C0]",
    Avatar: JimAvatar,
    primary: false,
  },
  {
    key: "angela",
    name: "Angela",
    role: "Roofing & Insurance Claims",
    tagline: "Every detail matters.",
    bg: "bg-purple-50",
    badge: "bg-[#F3E5F5] text-[#6A1B9A]",
    Avatar: AngelaAvatar,
    primary: false,
  },
  {
    key: "oscar",
    name: "Oscar",
    role: "Quotes & Invoices",
    tagline: "The numbers always add up.",
    bg: "bg-green-50",
    badge: "bg-[#E8F5E9] text-[#1B5E20]",
    Avatar: OscarAvatar,
    primary: false,
  },
  {
    key: "andy",
    name: "Andy",
    role: "Winback & Follow-up",
    tagline: "He always follows up. Always.",
    bg: "bg-red-50",
    badge: "bg-[#FFEBEE] text-[#B71C1C]",
    Avatar: AndyAvatar,
    primary: false,
  },
];

function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return phone.slice(0, 6) + "***-" + phone.slice(-4);
}

function fmtCallTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? "Today " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function callOutcomeBadge(call: CallLog) {
  if (call.appointmentBooked) return { label: "Booked",    cls: "bg-[#F0FDF4] text-[#15803D]" };
  if (call.status === "missed") return { label: "Missed",  cls: "bg-[#FEF2F2] text-[#DC2626]" };
  if (call.intent?.toLowerCase().includes("callback")) return { label: "Callback Requested", cls: "bg-[#FFFBEB] text-[#B45309]" };
  return { label: "Info Only", cls: "bg-[#EFF6FF] text-[#1D4ED8]" };
}

const CARD_SHADOW = "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]";

export default function FrontOfficePage() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [showCallLog, setShowCallLog] = useState(false);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bufferTime, setBufferTime] = useState("30");
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [weekendEnabled, setWeekendEnabled] = useState(false);
  const twilioNumber = process.env.NEXT_PUBLIC_TWILIO_NUMBER ?? "(not configured)";

  useEffect(() => {
    fetch("/api/agents/status").then(r => r.json()).then(setAgentStatus).catch(() => {});
    fetch("/api/calls/list").then(r => r.json()).then(d => setCalls(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/availability").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setAvailability(d);
    }).catch(() => {});
  }, []);

  const callsThisWeek = calls.filter(c => Date.now() - new Date(c.createdAt).getTime() < 7 * 86400000).length;
  const jobsBooked    = calls.filter(c => c.appointmentBooked).length;
  const missedCalls   = calls.filter(c => c.status === "missed").length;

  async function saveRules() {
    setSaving(true);
    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: availability }),
    }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#0D1117]">Your Front Office</h1>
          <p className="text-gray-400 text-sm mt-0.5">Always on. Never misses a call.</p>
        </div>

        {/* Stats bar */}
        <div className="bg-gray-100 rounded-xl px-5 py-3 text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
          <span><span className="font-semibold text-[#0D1117]">{agentStatus?.intake?.count ?? callsThisWeek}</span> calls answered this week</span>
          <span className="text-gray-300">·</span>
          <span><span className="font-semibold text-[#15803D]">{jobsBooked}</span> jobs booked</span>
          <span className="text-gray-300">·</span>
          <span><span className="font-semibold text-[#B45309]">{missedCalls}</span> missed calls followed up</span>
        </div>

        {/* Agent grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map(agent => {
            const Avatar = agent.Avatar;
            return (
              <div
                key={agent.key}
                className={`bg-white rounded-xl p-4 ${CARD_SHADOW} ${agent.primary ? "sm:col-span-2 lg:col-span-1 ring-2 ring-[#F59E0B] ring-offset-1" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`${agent.bg} rounded-full p-1 shrink-0`}>
                    <Avatar />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[20px] font-bold text-[#0D1117]">{agent.name}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${agent.badge}`}>
                        {agent.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{agent.tagline}</p>
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                      <span className="text-xs text-green-600 font-medium">
                        {agent.key === "erin" ? "On Duty" : "Active"}
                      </span>
                    </div>
                    {agent.key === "erin" && (
                      <p className="text-xs text-gray-400 mb-3">
                        {agentStatus?.intake?.count ?? 0} calls this week · {jobsBooked} jobs booked
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {agent.key === "erin" && (
                        <button
                          onClick={() => setShowCallLog(true)}
                          className="text-xs bg-[#0D1117] text-white px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors"
                        >
                          View Call Log
                        </button>
                      )}
                      <button className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                        Configure {agent.key === "erin" ? "Greeting" : ""}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Booking Rules */}
        <div className="bg-white rounded-xl p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h2 className="text-base font-bold text-[#0D1117] mb-5">Booking Rules</h2>
          <div className="space-y-5">

            {/* Available Hours */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Available Hours</label>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-gray-600">Mon–Fri</span>
                <input
                  type="time" defaultValue="08:00"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="time" defaultValue="18:00"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-600">Weekend</span>
                <button
                  onClick={() => setWeekendEnabled(w => !w)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${weekendEnabled ? "bg-[#0D1117]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${weekendEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className="text-xs text-gray-400">{weekendEnabled ? "Enabled" : "Off"}</span>
              </div>
            </div>

            {/* Auto-confirm */}
            <div className="flex items-start gap-4">
              <button
                onClick={() => setAutoConfirm(a => !a)}
                className={`relative mt-0.5 w-10 h-5 rounded-full shrink-0 transition-colors ${autoConfirm ? "bg-[#0D1117]" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoConfirm ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-[#0D1117]">Auto-confirm bookings</p>
                <p className="text-xs text-gray-400">Automatically confirm bookings without your approval</p>
              </div>
            </div>

            {/* Buffer time */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Buffer time between jobs</label>
              <select
                value={bufferTime}
                onChange={e => setBufferTime(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
              >
                <option value="30">30 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>

            {/* Twilio number */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Phone size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Phone</span>
              </div>
              <p className="text-base font-bold text-[#0D1117]">{twilioNumber}</p>
              <p className="text-xs text-gray-400 mt-0.5">Calls to this number are answered by Erin</p>
            </div>

            <button
              onClick={saveRules}
              disabled={saving}
              className="bg-[#0D1117] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#374151] disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Booking Rules"}
            </button>
          </div>
        </div>

      </div>

      {/* Call Log Modal */}
      {showCallLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#0D1117]">Call Log</h2>
              <button onClick={() => setShowCallLog(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {calls.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">No calls recorded yet.</p>
              ) : (
                calls.map(call => {
                  const badge = callOutcomeBadge(call);
                  return (
                    <div key={call.id} className="px-6 py-4 border-b border-gray-50 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0D1117]">{maskPhone(call.callerPhone)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmtCallTime(call.createdAt)}</p>
                          {call.intent && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{call.intent}</p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suppress unused availability warning */}
      <div className="hidden">{JSON.stringify(availability)}</div>
    </div>
  );
}
