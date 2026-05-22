"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: implement password reset email via Resend
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center px-5" style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      <div className="w-full max-w-[420px]">
        <div className="mb-10">
          <Logo height={30} />
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-[#E1E7F0] bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F0FDF4]">
              <svg className="h-6 w-6 text-[#16A34A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#07142F" }}>Check your email</h2>
            <p className="text-sm" style={{ color: "#5D6880" }}>
              If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
            </p>
            <Link
              href="/auth/login"
              className="mt-6 inline-block text-sm font-semibold hover:underline"
              style={{ color: "#07142F" }}
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold" style={{ color: "#07142F" }}>Forgot password?</h1>
              <p className="mt-2 text-sm" style={{ color: "#5D6880" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#E1E7F0] bg-white p-6 shadow-sm">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "#28354D" }}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#DCE3EE] px-4 py-3 text-sm outline-none focus:border-[#07142F] focus:ring-2 focus:ring-[#07142F]/10"
                  style={{ color: "#07142F" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-3 text-sm font-bold transition-opacity disabled:opacity-50"
                style={{ background: "#07142F", color: "#FFFFFF" }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm" style={{ color: "#5D6880" }}>
              <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "#07142F" }}>
                ← Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
