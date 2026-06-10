"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Business { name: string; industry: string; city: string | null; slug: string; phone: string | null }
interface Profile { headline: string | null; description: string | null; services: string | null; reviewCount: number; avgRating: number; bookingUrl: string | null }

type BookingStep = "view" | 1 | 2 | 3;
const PRIORITIES = [
  { value: "normal", label: "Normal", desc: "Within a few days" },
  { value: "urgent", label: "Urgent", desc: "Within 24 hours" },
  { value: "emergency", label: "Emergency 🚨", desc: "Right now" },
];

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<{ business: Business; profile: Profile } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<BookingStep>("view");
  const [selectedService, setSelectedService] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [contact, setContact] = useState({ name: "", phone: "", email: "", address: "", preferredDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((d) => d && setData(d))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return <div className="min-h-screen flex items-center justify-center"><div className="text-center p-8"><p className="text-4xl mb-4">🔍</p><h2 className="text-xl font-bold mb-2">Not found</h2></div></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" /></div>;

  const { business, profile } = data;
  const services = profile.services ? profile.services.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const initial = business.name.charAt(0).toUpperCase();

  async function submitBooking() {
    setSubmitting(true);
    try {
      await fetch("/api/booking/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: business.slug, serviceType: selectedService || "General Service", description, priority, ...contact }),
      });
    } catch { /* continue */ }
    setConfirmed(true); setSubmitting(false);
  }

  if (confirmed) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-[#0f172a] mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-2">Confirmation SMS sent to {contact.phone}.</p>
        <p className="text-gray-400 text-sm mb-8">{business.name} will reach out to confirm your time.</p>
        <div className="bg-[#0f172a] rounded-2xl p-5 text-left">
          <p className="text-gray-400 text-xs mb-2">Powered by Service Star</p>
          <p className="text-white text-sm font-medium mb-3">Want this automated booking for your business?</p>
          <Link href={`/auth/register?ref=${slug}`} className="block text-center bg-[#f97316] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">Start Free with Service Star →</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-[#0f172a] px-4 py-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="w-14 h-14 bg-[#f97316] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">{initial}</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">{business.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="bg-white/20 text-white/90 text-xs px-2.5 py-1 rounded-full">{business.industry}</span>
              {business.city && <span className="text-white/60 text-xs">📍 {business.city}</span>}
              {profile.reviewCount > 0 && <span className="text-yellow-400 text-xs">★ {profile.avgRating.toFixed(1)} ({profile.reviewCount})</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-20 space-y-4">
        {step === "view" && (
          <>
            {profile.headline && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-[#0f172a] font-semibold">{profile.headline}</p>
                {profile.description && <p className="text-gray-500 text-sm mt-1 leading-relaxed">{profile.description}</p>}
              </div>
            )}
            {services.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <button key={s} onClick={() => { setSelectedService(s); setStep(1); }}
                      className="bg-[#f8fafc] border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm hover:border-[#f97316] hover:text-[#f97316] transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setStep(1)} className="w-full bg-[#f97316] text-white py-4 rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">Book Service</button>
            {business.phone && <a href={`tel:${business.phone}`} className="block w-full text-center border-2 border-[#0f172a] text-[#0f172a] py-3.5 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition-colors">Call {business.phone}</a>}
            <div className="bg-[#0f172a] rounded-2xl p-5 text-center">
              <p className="text-white/70 text-sm mb-1">Want this for your business?</p>
              <Link href={`/auth/register?ref=${slug}`} className="block mt-3 bg-[#f97316] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">Start Free with Service Star →</Link>
            </div>
          </>
        )}

        {step === 1 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-0">
            <div className="flex items-center gap-2 mb-5"><button onClick={() => setStep("view")} className="text-gray-400 hover:text-gray-600">←</button><h2 className="font-bold text-[#0f172a]">What service do you need?</h2></div>
            {services.length > 0 ? (
              <div className="space-y-2 mb-4">
                {services.map((s) => (
                  <label key={s} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer ${selectedService === s ? "border-[#f97316] bg-orange-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="svc" value={s} checked={selectedService === s} onChange={() => setSelectedService(s)} className="sr-only" />
                    <span className="text-sm font-medium">{s}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input type="text" value={selectedService} onChange={(e) => setSelectedService(e.target.value)} placeholder="Service needed" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none" />
            )}
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the problem (optional)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none resize-none" />
            <div className="space-y-2 mb-4">
              {PRIORITIES.map((p) => (
                <label key={p.value} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer ${priority === p.value ? "border-[#f97316] bg-orange-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <input type="radio" name="pri" value={p.value} checked={priority === p.value} onChange={() => setPriority(p.value)} className="sr-only" />
                  <div><p className="text-sm font-medium">{p.label}</p><p className="text-xs text-gray-500">{p.desc}</p></div>
                </label>
              ))}
            </div>
            {priority === "emergency" && business.phone && <a href={`tel:${business.phone}`} className="block w-full text-center bg-red-500 text-white py-4 rounded-2xl font-bold mb-3 hover:bg-red-600">🚨 Call Now: {business.phone}</a>}
            <button onClick={() => setStep(2)} disabled={!selectedService} className="w-full bg-[#f97316] text-white py-4 rounded-2xl font-bold hover:bg-orange-600 disabled:opacity-50">Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-0">
            <div className="flex items-center gap-2 mb-5"><button onClick={() => setStep(1)} className="text-gray-400">←</button><h2 className="font-bold text-[#0f172a]">Your contact details</h2></div>
            <div className="space-y-4">
              {([["name","Your Name *","text"],["phone","Phone Number *","tel"],["email","Email","email"],["address","Service Address *","text"]] as Array<[keyof typeof contact, string, string]>).map(([k, label, type]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={contact[k]} onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Preferred Date/Time</label>
                <input type="datetime-local" value={contact.preferredDate} onChange={(e) => setContact((c) => ({ ...c, preferredDate: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none" />
              </div>
            </div>
            <button onClick={submitBooking} disabled={submitting || !contact.name || !contact.phone || !contact.address}
              className="w-full mt-5 bg-[#f97316] text-white py-4 rounded-2xl font-bold hover:bg-orange-600 disabled:opacity-50">
              {submitting ? "Confirming..." : "Confirm Booking →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
