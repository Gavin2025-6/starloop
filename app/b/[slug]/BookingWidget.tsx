"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface Props {
  businessId: string;
  businessName: string;
  businessPhone: string | null;
  bookingUrl: string | null;
  hasAvailability: boolean;
  services: string[];
}

interface Slot {
  time: string;
  label: string;
}

type Step = "service" | "date" | "time" | "info" | "done" | "done_no_avail";

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function BookingWidget({
  businessId, businessName, businessPhone, bookingUrl, hasAvailability, services,
}: Props) {
  const [step, setStep] = useState<Step>(hasAvailability && services.length > 0 ? "service" : hasAvailability ? "date" : "done_no_avail");
  const [service, setService] = useState(services[0] ?? "");
  const [calCursor, setCalCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Legacy: no availability configured
  if (step === "done_no_avail") {
    if (bookingUrl) {
      return (
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
          className="block w-full bg-[#f97316] text-white text-center py-4 rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
          Book an Appointment
        </a>
      );
    }
    if (businessPhone) {
      return (
        <a href={`tel:${businessPhone}`}
          className="block w-full bg-[#f97316] text-white text-center py-4 rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
          Call to Book: {businessPhone}
        </a>
      );
    }
    return null;
  }

  async function pickDate(d: Date) {
    setSelectedDate(d);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/availability/slots?businessId=${businessId}&date=${d.toISOString().slice(0, 10)}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
    setStep("time");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;
    setSubmitting(true); setError("");

    const scheduledAt = new Date(selectedDate);
    const [h, m] = selectedSlot.time.split(":").map(Number);
    scheduledAt.setHours(h, m, 0, 0);

    const res = await fetch("/api/booking/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        name, phone, notes,
        service,
        scheduledAt: scheduledAt.toISOString(),
      }),
    });

    if (!res.ok) {
      setError("Booking failed. Please try again or call us.");
    } else {
      setStep("done");
    }
    setSubmitting(false);
  }

  // Calendar grid
  function buildGrid(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days: Date[] = [];
    for (let i = 0; i < first.getDay(); i++) {
      days.push(new Date(year, month, 1 - (first.getDay() - i)));
    }
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) {
      days.push(new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1));
    }
    return days;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const grid = buildGrid(calCursor);

  if (step === "done") {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={24} className="text-green-600" />
        </div>
        <h3 className="font-bold text-[#1a2744] text-lg mb-1">Booking Confirmed!</h3>
        <p className="text-gray-500 text-sm">
          {formatDateShort(selectedDate!)} at {selectedSlot?.label}
        </p>
        <p className="text-gray-400 text-xs mt-2">{businessName} will reach out to confirm.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b border-gray-100">
        {(["service", "date", "time", "info"] as Step[]).map((s, i) => {
          const labels: Record<Step, string> = { service: "Service", date: "Date", time: "Time", info: "Details", done: "", done_no_avail: "" };
          const stepOrder: Step[] = ["service", "date", "time", "info", "done"];
          const current = stepOrder.indexOf(step);
          const idx = stepOrder.indexOf(s);
          return (
            <div key={s} className={`flex-1 py-2.5 text-center text-xs font-medium transition-colors
              ${idx < current ? "text-green-600" : idx === current ? "text-[#f97316]" : "text-gray-300"}`}>
              {idx < current ? "✓" : `${i + 1}. `}{labels[s]}
            </div>
          );
        })}
      </div>

      <div className="p-5">
        {/* Step 1: Service */}
        {step === "service" && (
          <div>
            <h3 className="font-semibold text-[#0d1117] mb-3">What service do you need?</h3>
            <div className="space-y-2">
              {services.map((s) => (
                <button key={s} type="button" onClick={() => { setService(s); setStep("date"); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors
                    ${service === s ? "border-[#f97316] bg-orange-50 text-[#f97316] font-medium" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
                  {s}
                </button>
              ))}
              {services.length === 0 && (
                <button type="button" onClick={() => setStep("date")}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-gray-300">
                  General Service
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Date */}
        {step === "date" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0d1117]">Choose a date</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => { const d = new Date(calCursor); d.setMonth(d.getMonth() - 1); setCalCursor(d); }}
                  className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft size={14} /></button>
                <span className="text-xs font-medium text-gray-600 min-w-[90px] text-center">
                  {calCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => { const d = new Date(calCursor); d.setMonth(d.getMonth() + 1); setCalCursor(d); }}
                  className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight size={14} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {grid.map((day, i) => {
                const isPast = day < today;
                const inMonth = day.getMonth() === calCursor.getMonth();
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                return (
                  <button key={i} type="button" disabled={isPast || !inMonth}
                    onClick={() => pickDate(day)}
                    className={`aspect-square rounded-lg text-xs font-medium transition-colors
                      ${!inMonth ? "opacity-20 cursor-default" : ""}
                      ${isPast && inMonth ? "text-gray-300 cursor-default" : ""}
                      ${!isPast && inMonth ? "hover:bg-orange-50 hover:text-[#f97316]" : ""}
                      ${isSelected ? "bg-[#f97316] text-white hover:bg-[#f97316]" : ""}
                    `}>
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep("service")} className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <ChevronLeft size={12} /> Back
            </button>
          </div>
        )}

        {/* Step 3: Time slot */}
        {step === "time" && (
          <div>
            <h3 className="font-semibold text-[#0d1117] mb-1">
              {selectedDate ? formatDateShort(selectedDate) : ""}
            </h3>
            <p className="text-xs text-gray-400 mb-3">Available times</p>
            {loadingSlots ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">No availability on this day.</p>
                <button onClick={() => { setSelectedDate(null); setStep("date"); }}
                  className="mt-2 text-[#f97316] text-xs hover:underline">Choose another date</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <button key={slot.time} type="button" onClick={() => { setSelectedSlot(slot); setStep("info"); }}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-colors
                      ${selectedSlot?.time === slot.time
                        ? "bg-[#f97316] text-white border-[#f97316]"
                        : "border-gray-200 text-gray-700 hover:border-[#f97316] hover:text-[#f97316]"}`}>
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep("date")} className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <ChevronLeft size={12} /> Back
            </button>
          </div>
        )}

        {/* Step 4: Contact info */}
        {step === "info" && (
          <form onSubmit={handleSubmit}>
            <h3 className="font-semibold text-[#0d1117] mb-1">Your details</h3>
            <p className="text-xs text-gray-400 mb-3">
              {selectedDate ? formatDateShort(selectedDate) : ""} at {selectedSlot?.label}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone *</label>
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (416) 555-0100"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything helpful for us to know..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none" />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setStep("time")}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Back
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-[#f97316] text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-60">
                {submitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
