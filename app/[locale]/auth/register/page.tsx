"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, businessName, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create account. Please try again.");
    } else {
      router.push("/en/onboarding");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] lg:grid lg:grid-cols-[0.95fr_1.05fr]" style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      <section className="hidden min-h-screen flex-col justify-between bg-[#070A12] p-10 text-white lg:flex">
        <Logo variant="dark" height={30} showTagline />
        <div className="max-w-lg">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "#18D6C6" }}>
            Free for your first location
          </p>
          <h1 className="text-5xl font-bold leading-tight">
            Get more 5-star reviews. Automatically.
          </h1>
          <div className="mt-9 grid grid-cols-2 gap-3">
            {[
              ["Review requests", "Auto-sent at the perfect moment"],
              ["Recovery actions", "Win back unhappy customers"],
              ["Risk inbox", "Catch at-risk customers early"],
              ["Weekly trust report", "Know what to improve"],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5" style={{ color: "#A7B0C4" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: "#6F7A94" }}>No credit card required to start.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[460px]">
          <div className="mb-10 lg:hidden">
            <Logo height={30} />
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold" style={{ color: "#07142F" }}>Create your account</h1>
            <p className="mt-2 text-sm" style={{ color: "#5D6880" }}>
              Start collecting reviews in minutes. No credit card needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#E1E7F0] bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "#28354D" }}>Your name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-[#DCE3EE] px-4 py-3 text-sm outline-none focus:border-[#07142F] focus:ring-2 focus:ring-[#07142F]/10"
                  style={{ color: "#07142F" }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "#28354D" }}>Business name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Bright Dental"
                  className="w-full rounded-lg border border-[#DCE3EE] px-4 py-3 text-sm outline-none focus:border-[#07142F] focus:ring-2 focus:ring-[#07142F]/10"
                  style={{ color: "#07142F" }}
                />
              </div>
            </div>
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
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "#28354D" }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-[#DCE3EE] px-4 py-3 pr-11 text-sm outline-none focus:border-[#07142F] focus:ring-2 focus:ring-[#07142F]/10"
                  style={{ color: "#07142F" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8896B0] hover:text-[#07142F]"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-3 text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ background: "#07142F", color: "#FFFFFF" }}
            >
              {loading ? "Loading..." : "Get started free →"}
            </button>
            <p className="text-center text-xs" style={{ color: "#7F8AA3" }}>
              ✓ No credit card &nbsp;·&nbsp; ✓ Free for 1 location
            </p>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#5D6880" }}>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "#07142F" }}>
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
