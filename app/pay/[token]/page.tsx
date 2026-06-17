"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CheckCircle, MapPin, Calendar, DollarSign, Phone } from "lucide-react";

interface JobData {
  id: string;
  jobNumber: string;
  status: string;
  serviceType: string;
  serviceDescription: string | null;
  title: string;
  scheduledAt: string | null;
  address: string | null;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: string | null;
  business: {
    name: string;
    phone: string | null;
    slug: string;
    googleBusinessUrl: string | null;
    stripeChargesEnabled: boolean;
  };
  customer: {
    name: string;
    email: string | null;
  };
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleString("en-CA", {
    weekday: "long", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function fmtShort(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-CA", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-[#0D1117] text-white flex items-center justify-center text-lg font-bold shrink-0">
      {initials}
    </div>
  );
}

// ── Payment Form (Stripe active) ──────────────────────────────────────────────
function PaymentForm({
  token, job, onSuccess,
}: { token: string; job: JobData; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState(job.customer.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setSaving(true);

    if (email) {
      await fetch(`/api/pay/${token}/save-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
    }

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pay/${token}?paid=1`,
        receipt_email: email || undefined,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setSaving(false);
    } else {
      onSuccess();
    }
  }

  const amountLabel = job.status === "partially_paid"
    ? `$${job.balanceAmount.toFixed(2)}`
    : `$${job.total.toFixed(2)}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Email for receipt *
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0D1117]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Payment
        </label>
        <div className="border border-gray-200 rounded-lg p-3">
          <PaymentElement />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || saving}
        className="w-full bg-[#0D1117] text-white py-3.5 rounded-xl text-base font-bold hover:bg-[#374151] disabled:opacity-50 transition-colors"
      >
        {saving ? "Processing…" : `Pay ${amountLabel}`}
      </button>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ClientHubPage() {
  const { token } = useParams<{ token: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showReviewButton, setShowReviewButton] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/pay/${token}`).catch(() => null);
    if (res?.ok) {
      const data: JobData = await res.json();
      setJob(data);

      if (["awaiting_payment", "partially_paid"].includes(data.status) && data.business.stripeChargesEnabled) {
        const piRes = await fetch(`/api/pay/${token}/create-payment-intent`, { method: "POST" }).catch(() => null);
        if (piRes?.ok) {
          const { clientSecret: cs } = await piRes.json();
          setClientSecret(cs);
        }
      }

      if (data.status === "paid") {
        const urlParams = new URLSearchParams(window.location.search);
        const justPaid = urlParams.get("paid") === "1";
        if (!justPaid) {
          setShowReviewButton(true);
        } else {
          setTimeout(() => setShowReviewButton(true), 30 * 60 * 1000);
        }
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500 text-base">This link is not valid or has expired.</p>
        </div>
      </div>
    );
  }

  const isPaid = job.status === "paid";
  const isAwaitingPayment = ["awaiting_payment", "partially_paid"].includes(job.status);
  const isScheduled = ["scheduled", "in_progress"].includes(job.status);
  const isCancelled = ["cancelled", "no_show"].includes(job.status);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const rebookUrl = `${appUrl}/book/${job.business.slug}`;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-md mx-auto px-4 py-8">

        {/* Business header */}
        <div className="flex items-center gap-3 mb-6">
          <InitialsAvatar name={job.business.name} />
          <div>
            <p className="font-bold text-[#0D1117] text-base">{job.business.name}</p>
            <p className="text-sm text-gray-500">{job.serviceType}</p>
          </div>
        </div>

        {/* Job details card */}
        <div
          className="bg-white rounded-2xl p-5 mb-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          {job.scheduledAt && (
            <div className="flex items-start gap-2.5 mb-3">
              <Calendar size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">{fmtDate(job.scheduledAt)}</span>
            </div>
          )}
          {job.address && (
            <div className="flex items-start gap-2.5 mb-3">
              <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">{job.address}</span>
            </div>
          )}
          {job.serviceDescription && (
            <p className="text-sm text-gray-600 mt-1">{job.serviceDescription}</p>
          )}

          {/* Amount */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {job.status === "partially_paid" ? (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-[#10B981] font-semibold">${job.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Balance due</span>
                  <span className="text-[#0D1117] font-bold">${job.balanceAmount.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <DollarSign size={14} />
                  {isPaid ? "Amount paid" : "Total"}
                </div>
                <span className="text-xl font-bold text-[#0D1117]">
                  ${isPaid ? job.paidAmount.toFixed(2) : job.total.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── STATE 1: Scheduled / In Progress ── */}
        {isScheduled && (
          <div className="bg-[#EFF6FF] rounded-2xl p-5 text-center">
            <p className="text-[#1D4ED8] font-semibold text-base">Your appointment is confirmed.</p>
            <p className="text-sm text-[#3B82F6] mt-1">Payment will be collected when the service is complete.</p>
          </div>
        )}

        {/* ── STATE 2: Awaiting Payment ── */}
        {isAwaitingPayment && (
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h2 className="text-base font-bold text-[#0D1117] mb-4">
              {job.status === "partially_paid" ? "Pay remaining balance" : "Complete payment"}
            </h2>
            {stripePromise && clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: "stripe", variables: { colorPrimary: "#0D1117" } },
                }}
              >
                <PaymentForm token={token} job={job} onSuccess={() => load()} />
              </Elements>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ready to pay? Contact {job.business.name} directly:
                </p>
                {job.business.phone && (
                  <div className="flex flex-col gap-3">
                    <a
                      href={`tel:${job.business.phone}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-[#0D1117] text-[#0D1117] font-semibold text-base hover:bg-gray-50 transition-colors"
                    >
                      <Phone size={18} /> Call us
                    </a>
                    <a
                      href={`sms:${job.business.phone}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#0D1117] text-white font-semibold text-base hover:bg-[#374151] transition-colors"
                    >
                      💬 Send a text
                    </a>
                  </div>
                )}
                {!job.business.phone && (
                  <p className="text-sm text-gray-400">Online payment is currently unavailable.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STATE 3: Paid ── */}
        {isPaid && (
          <div className="space-y-4">
            <div className="bg-[#F0FDF4] rounded-2xl p-6 text-center">
              <CheckCircle size={44} className="text-[#10B981] mx-auto mb-3" />
              <p className="text-[#15803D] font-bold text-2xl mb-2">
                Thank you, {job.customer.name}!
              </p>
              <p className="text-sm text-[#166534]">
                {job.serviceType}
                {job.scheduledAt ? ` · ${fmtShort(job.scheduledAt)}` : ""}
                {" · "}${job.paidAmount > 0 ? job.paidAmount.toFixed(2) : job.total.toFixed(2)}
              </p>
              {job.customer.email && (
                <p className="text-sm text-[#166534] mt-2">
                  A receipt has been sent to your email.
                </p>
              )}
              <p className="text-xs text-[#4ADE80] mt-3">
                We&apos;ll follow up shortly — we&apos;d love to hear how it went.
              </p>
            </div>

            {showReviewButton && job.business.googleBusinessUrl && (
              <a
                href={`/api/review-click/${token}?via=page`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#4A6FFF] text-white text-center py-3.5 rounded-xl text-base font-bold hover:bg-[#3B5EEE] transition-colors"
              >
                ⭐ Leave a Google Review
              </a>
            )}
          </div>
        )}

        {/* ── STATE 4: Cancelled / No-Show ── */}
        {isCancelled && (
          <div className="bg-gray-50 rounded-2xl p-6 text-center space-y-4">
            <p className="text-gray-700 font-semibold text-base">This appointment has been cancelled.</p>
            <a
              href={rebookUrl}
              className="block w-full py-3.5 rounded-xl bg-[#0D1117] text-white font-semibold text-base hover:bg-[#374151] transition-colors"
            >
              Book a new appointment
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
