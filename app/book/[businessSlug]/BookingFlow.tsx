"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

interface PriceBookItem {
  id: string;
  name: string;
  description: string | null;
  priceMin: number;
  priceMax: number;
  unit: string;
}

interface BusinessInfo {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  bookingWeekendEnabled: boolean;
  cancellationProtectionEnabled: boolean;
  cancellationPolicyText: string | null;
  stripePublishableKey: string | null;
}

interface Slot {
  time: string;
  available: boolean;
}

type Step = 1 | 2 | 3 | 4 | 5;

interface Props {
  business: BusinessInfo;
  initial: string;
  priceBookItems: PriceBookItem[];
}

const STEP_LABELS = ["Service", "Date", "Time", "Details", "Confirm"];

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatPrice(min: number, max: number): string {
  if (Math.abs(min - max) < 0.01) return `$${Math.round(min)}`;
  return `$${Math.round(min)}–$${Math.round(max)}`;
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildCalendarGrid(cursor: Date): Date[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
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

export default function BookingFlow({ business, initial, priceBookItems }: Props) {
  const router = useRouter();

  const defaultService = priceBookItems.length > 0 ? priceBookItems[0] : null;

  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<PriceBookItem | null>(defaultService);
  const [calCursor, setCalCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const grid = buildCalendarGrid(calCursor);

  async function pickDate(d: Date) {
    setSelectedDate(d);
    setSelectedSlot(null);
    setSlots([]);
    setLoadingSlots(true);
    try {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const res = await fetch(`/api/availability/slots?businessId=${business.id}&date=${dateStr}`);
      const data = await res.json();
      setSlots((data.slots ?? []).filter((s: Slot) => s.available));
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
    setStep(3);
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedSlot || !selectedService) return;
    setSubmitting(true);
    setError("");

    const scheduledAt = new Date(selectedDate);
    const [h, m] = selectedSlot.split(":").map(Number);
    scheduledAt.setHours(h, m, 0, 0);

    const res = await fetch("/api/booking/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        name,
        phone,
        address,
        notes,
        service: selectedService.name,
        scheduledAt: scheduledAt.toISOString(),
      }),
    });

    if (!res.ok) {
      setError("Booking failed. Please try again or call us.");
      setSubmitting(false);
      return;
    }

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const params = new URLSearchParams({
      service: selectedService.name,
      date: dateStr,
      time: formatTime(selectedSlot),
      phone,
      address,
      businessName: business.name,
    });
    router.push(`/book/${business.slug}/confirmed?${params.toString()}`);
  }

  function isDateDisabled(day: Date): boolean {
    if (day < today) return true;
    const inMonth = day.getMonth() === calCursor.getMonth();
    if (!inMonth) return true;
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    if (isWeekend && !business.bookingWeekendEnabled) return true;
    return false;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-[family-name:var(--font-geist)]">
      {/* Header */}
      <div className="bg-[#1a2744] px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-[#f97316] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">{initial}</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">{business.name}</h1>
            <p className="text-white/60 text-xs mt-0.5">Book an appointment</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex">
            {STEP_LABELS.map((label, i) => {
              const stepNum = (i + 1) as Step;
              const isPast = stepNum < step;
              const isCurrent = stepNum === step;
              return (
                <div key={label} className="flex-1 py-3 text-center">
                  <div className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    isPast ? "text-green-600" : isCurrent ? "text-[#f97316]" : "text-gray-300"
                  }`}>
                    {isPast ? "✓" : `${stepNum}.`} {label}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-0.5 bg-gray-100 -mt-px">
            <div
              className="h-0.5 bg-[#f97316] transition-all duration-300"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0d1117]">Select a service</h2>
              <p className="text-gray-400 text-sm mt-1">What can we help you with?</p>
            </div>
            <div className="space-y-3">
              {priceBookItems.length === 0 && (
                <button
                  type="button"
                  onClick={() => { setSelectedService(null); setStep(2); }}
                  className="w-full text-left p-4 rounded-2xl border-2 border-[#f97316] bg-orange-50 transition-all"
                >
                  <div className="font-semibold text-[#0d1117]">General Service</div>
                  <div className="text-gray-400 text-sm mt-0.5">We'll discuss details when we connect</div>
                </button>
              )}
              {priceBookItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setSelectedService(item); setStep(2); }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    selectedService?.id === item.id
                      ? "border-[#f97316] bg-orange-50"
                      : "border-gray-200 bg-white hover:border-[#f97316]/50 hover:bg-orange-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0d1117]">{item.name}</div>
                      {item.description && (
                        <div className="text-gray-500 text-sm mt-0.5 leading-relaxed">{item.description}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold text-[#f97316]">{formatPrice(item.priceMin, item.priceMax)}</div>
                      {item.unit !== "flat" && (
                        <div className="text-gray-400 text-xs">per {item.unit}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0d1117]">Pick a date</h2>
              <p className="text-gray-400 text-sm mt-1">
                {selectedService ? selectedService.name : "General Service"}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => { const d = new Date(calCursor); d.setMonth(d.getMonth() - 1); setCalCursor(d); }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-500" />
                </button>
                <span className="font-semibold text-[#0d1117]">
                  {calCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button
                  onClick={() => { const d = new Date(calCursor); d.setMonth(d.getMonth() + 1); setCalCursor(d); }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronRight size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {grid.map((day, i) => {
                  const disabled = isDateDisabled(day);
                  const inMonth = day.getMonth() === calCursor.getMonth();
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  const isToday = isSameDay(day, today);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => pickDate(day)}
                      className={`aspect-square rounded-xl text-sm font-medium transition-colors relative ${
                        !inMonth ? "opacity-0 pointer-events-none" :
                        disabled ? "text-gray-200 cursor-not-allowed" :
                        isSelected ? "bg-[#f97316] text-white" :
                        "hover:bg-orange-50 hover:text-[#f97316] text-[#0d1117]"
                      }`}
                    >
                      {day.getDate()}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#f97316]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              <ChevronLeft size={14} /> Back
            </button>
          </div>
        )}

        {/* Step 3: Select Time */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0d1117]">
                {selectedDate ? formatDateShort(selectedDate) : "Pick a time"}
              </h2>
              <p className="text-gray-400 text-sm mt-1">Available time slots</p>
            </div>

            {loadingSlots ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-gray-500 font-medium">No availability on this day.</p>
                <button
                  onClick={() => { setSelectedDate(null); setStep(2); }}
                  className="mt-3 text-[#f97316] text-sm font-semibold hover:underline"
                >
                  Choose another date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => { setSelectedSlot(slot.time); setStep(4); }}
                    className={`py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                      selectedSlot === slot.time
                        ? "bg-[#f97316] text-white border-[#f97316]"
                        : "bg-white border-gray-200 text-[#0d1117] hover:border-[#f97316] hover:text-[#f97316] hover:bg-orange-50"
                    }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              <ChevronLeft size={14} /> Back
            </button>
          </div>
        )}

        {/* Step 4: Your Details */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0d1117]">Your details</h2>
              <p className="text-gray-400 text-sm mt-1">
                {selectedDate ? formatDateShort(selectedDate) : ""}{selectedSlot ? ` at ${formatTime(selectedSlot)}` : ""}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (416) 555-0100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Service Address *</label>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, Toronto, ON"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes (optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything helpful for us to know — access codes, parking, specific areas to address..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!name.trim() || !phone.trim() || !address.trim()) {
                    setError("Please fill in all required fields.");
                    return;
                  }
                  setError("");
                  setStep(5);
                }}
                className="flex-2 flex-1 py-3 bg-[#f97316] text-white rounded-2xl text-sm font-bold hover:bg-orange-600 transition-colors"
              >
                Continue
              </button>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0d1117]">Confirm your booking</h2>
              <p className="text-gray-400 text-sm mt-1">Review your details before we confirm</p>
            </div>

            {/* Summary card */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-[#1a2744] px-5 py-4">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Booking Summary</p>
              </div>
              <div className="p-5 space-y-3">
                <Row label="Service" value={selectedService?.name ?? "General Service"} />
                <Row label="Date" value={selectedDate ? formatDateLong(selectedDate) : ""} />
                <Row label="Time" value={selectedSlot ? formatTime(selectedSlot) : ""} />
                <Row label="Address" value={address} />
                <Row label="Name" value={name} />
                <Row label="Phone" value={phone} />
                {notes && <Row label="Notes" value={notes} />}
                {selectedService && (
                  <div className="pt-3 border-t border-gray-100 flex justify-between">
                    <span className="text-sm font-semibold text-gray-500">Estimated Price</span>
                    <span className="text-sm font-bold text-[#f97316]">
                      {formatPrice(selectedService.priceMin, selectedService.priceMax)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {business.cancellationProtectionEnabled && business.cancellationPolicyText && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-0.5">Cancellation Policy</p>
                  <p className="text-xs text-amber-700">{business.cancellationPolicyText}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(4)}
                disabled={submitting}
                className="flex-1 py-3 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 py-3 bg-[#f97316] text-white rounded-2xl text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-[#0d1117] text-right">{value}</span>
    </div>
  );
}
