"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CheckCircle, MapPin, Calendar, DollarSign, Phone, MessageSquare } from "lucide-react";

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
    slug: string;
    phone: string | null;
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

function fmtDateShort(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-CA", {
    month: "long", day: "numeric", year: "numeric",
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

  const load = useCallback(async () => {
    const res = await fetch(`/api/pay/${token}`).catch(() => null);
    if (res?.ok) {
      const data: JobData = await res.json();
      setJob(data);

      if (["awaiting_payment", "partially_paid", "completed"].includes(data.status) && data.business.stripeChargesEnabled) {
        const piRes = await fetch(`/api/pay/${token}/create-payment-intent`, { method: "POST" }).catch(() => null);
        if (piRes?.ok) {
          const { clientSecret: cs } = await piRes.json();
          setClientSecret(cs);
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
  const isAwaitingPayment = ["awaiting_payment", "partially_paid", "completed"].includes(job.status);
  const isScheduled = ["scheduled", "in_progress"].includes(job.status);
  const isCancelled = ["cancelled", "no_show"].includes(job.status);
  const stripeReady = !!stripePromise && !!clientSecret && job.business.stripeChargesEnabled;

  // Format customer first name (title-case)
  const customerFirstName = (job.customer.name || "")
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .split(" ")[0] || job.customer.name;

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
          {!isCancelled && (
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
          )}
        </div>

        {/* ── STATE 1: Scheduled / In Progress ── */}
        {isScheduled && (
          <div className="bg-[#EFF6FF] rounded-2xl p-5 text-center">
            <p className="text-[#1D4ED8] font-semibold text-base">Your appointment is confirmed.</p>
            <p className="text-sm text-[#3B82F6] mt-1">Payment will be collected when the service is complete.</p>
          </div>
        )}

        {/* ── STATE 2: Ready to Pay ── */}
        {isAwaitingPayment && (
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <h2 className="text-base font-bold text-[#0D1117] mb-4">
              {job.status === "partially_paid" ? "Pay remaining balance" : "Complete payment"}
            </h2>
            {stripeReady ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: clientSecret!,
                  appearance: { theme: "stripe", variables: { colorPrimary: "#0D1117" } },
                }}
              >
                <PaymentForm token={token} job={job} onSuccess={() => load()} />
              </Elements>
            ) : (
              /* Stripe not active — show contact fallback */
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ready to pay? Contact{" "}
                  <span className="font-semibold text-[#0D1117]">{job.business.name}</span>{" "}
                  directly:
                </p>
                {job.business.phone ? (
                  <div className="flex flex-col gap-3">
                    <a
                      href={`tel:${job.business.phone}`}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0D1117] text-white font-semibold text-base hover:bg-[#374151] transition-colors"
                    >
                      <Phone size={18} /> Call us
                    </a>
                    <a
                      href={`sms:${job.business.phone}`}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-[#0D1117] text-[#0D1117] font-semibold text-base hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare size={18} /> Send a text
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Please contact {job.business.name} for payment details.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STATE 3: Paid ── */}
        {isPaid && (
          <div className="space-y-4">
            <div className="bg-[#F0FDF4] rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-[#15803D] font-bold text-xl mb-1">
                Thank you, {customerFirstName}!
              </p>
              <div className="text-sm text-[#166534] mt-2 space-y-1">
                <p>{job.serviceType} · {fmtDateShort(job.scheduledAt)} · ${job.paidAmount.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 text-center space-y-2" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <p className="text-sm text-gray-600">A receipt has been sent to your email.</p>
              <p className="text-sm text-gray-400">
                We&apos;ll follow up shortly — we&apos;d love to hear how it went.
              </p>
            </div>
          </div>
        )}

        {/* ── STATE 4: Cancelled / No Show ── */}
        {isCancelled && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
              <p className="text-gray-700 font-semibold text-base mb-1">
                This appointment has been cancelled.
              </p>
              <p className="text-sm text-gray-400">
                {job.status === "no_show" ? "This slot has been marked as a no-show." : "Please contact us if you have any questions."}
              </p>
            </div>
            <a
              href={`/book/${job.business.slug}`}
              className="flex items-center justify-center w-full py-3.5 rounded-xl bg-[#0D1117] text-white font-semibold text-base hover:bg-[#374151] transition-colors"
            >
              Book again
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
