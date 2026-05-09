"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface GateInfo {
  businessName: string;
  businessCategory: string | null;
  customerName: string;
  googleUrl: string | null;
  requestId: string;
}

type Step = "rating" | "feedback" | "done" | "error";

export default function ReviewGatePage() {
  const params = useParams();
  const token = params.token as string;

  const [info, setInfo] = useState<GateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/review-gate?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setStep("error"); setErrorMsg(data.error); }
        else setInfo(data);
      })
      .catch(() => { setStep("error"); setErrorMsg("Something went wrong."); })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleRatingSelect(star: number) {
    setRating(star);

    if (star >= 4) {
      // Positive — submit immediately and redirect to Google
      setSubmitting(true);
      try {
        const res = await fetch("/api/review-gate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, rating: star }),
        });
        const data = await res.json();
        if (data.googleUrl) {
          window.location.href = data.googleUrl;
        } else {
          // No Google URL configured — show thank you
          setStep("done");
        }
      } catch {
        setStep("error");
        setErrorMsg("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else {
      // Negative — show feedback form
      setStep("feedback");
    }
  }

  async function handleFeedbackSubmit() {
    setSubmitting(true);
    try {
      await fetch("/api/review-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          feedback,
          contactPhone: contactPhone.trim() || null,
          contactEmail: contactEmail.trim() || null,
        }),
      });
      setStep("done");
    } catch {
      setErrorMsg("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Link not found</h2>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your feedback has been received. We appreciate you taking the time
            to share your experience with us.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-sm w-full text-center">
        {/* Business name */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {info?.businessName?.charAt(0).toUpperCase() ?? "⭐"}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{info?.businessName}</h1>
          {info?.businessCategory && (
            <p className="text-sm text-gray-400 mt-1">{info.businessCategory}</p>
          )}
        </div>

        {/* Step: Rating */}
        {step === "rating" && (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              How was your experience?
            </h2>
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  disabled={submitting}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => handleRatingSelect(star)}
                  className="text-4xl transition-transform hover:scale-110 disabled:opacity-50 focus:outline-none"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  <span className={star <= (hovered || rating) ? "text-yellow-400" : "text-gray-200"}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {submitting ? "Redirecting..." : "Tap a star to rate"}
            </p>
          </>
        )}

        {/* Step: Negative feedback form */}
        {step === "feedback" && (
          <>
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
                >
                  ★
                </span>
              ))}
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Tell us what went wrong
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Your feedback stays private and helps us improve.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="What could we have done better?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />
            <div className="mb-4 text-left space-y-3">
              <p className="text-sm font-medium text-gray-700">
                How can we reach you?{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">📱 Phone number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. 416-555-0123"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">📧 Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400">
                We&apos;ll only use this to make things right
              </p>
            </div>
            {errorMsg && (
              <p className="text-xs text-red-500 mb-3">{errorMsg}</p>
            )}
            <button
              onClick={handleFeedbackSubmit}
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
            <button
              onClick={() => { setStep("rating"); setRating(0); }}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600"
            >
              ← Change rating
            </button>
          </>
        )}
      </div>
    </div>
  );
}
