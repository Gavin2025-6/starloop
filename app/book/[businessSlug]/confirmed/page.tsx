"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service") ?? "Service";
  const date = searchParams.get("date") ?? "";
  const time = searchParams.get("time") ?? "";
  const phone = searchParams.get("phone") ?? "";
  const address = searchParams.get("address") ?? "";
  const businessName = searchParams.get("businessName") ?? "us";

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-[#f8fafc] font-[family-name:var(--font-geist)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Checkmark animation */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-[pop_0.4s_ease-out_forwards]">
            <svg
              className="w-10 h-10 text-green-600 animate-[drawCheck_0.4s_ease-out_0.2s_forwards] opacity-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0d1117]">You&apos;re booked!</h1>
          <p className="text-gray-500 mt-2">
            We&apos;ll see you {formattedDate} at {time}
          </p>
        </div>

        {/* Booking summary */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
          <div className="bg-[#1a2744] px-5 py-3">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Booking Details</p>
          </div>
          <div className="p-5 space-y-3">
            <Row label="Service" value={service} />
            <Row label="Date" value={formattedDate} />
            <Row label="Time" value={time} />
            {address && <Row label="Address" value={address} />}
          </div>
        </div>

        {phone && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center mb-6">
            <p className="text-green-700 text-sm font-medium">
              A confirmation has been sent to{" "}
              <span className="font-bold">{phone}</span>
            </p>
          </div>
        )}

        <p className="text-center text-gray-400 text-sm">
          {businessName} will be in touch to confirm your appointment.
        </p>

      </div>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <>
      <style>{`
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCheck {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
      <Suspense fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ConfirmedContent />
      </Suspense>
    </>
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
