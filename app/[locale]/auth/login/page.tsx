"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push(`/${locale}/dashboard`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] lg:grid lg:grid-cols-[0.95fr_1.05fr]" style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      <section className="hidden min-h-screen flex-col justify-between bg-[#070A12] p-10 text-white lg:flex">
        <Logo variant="dark" height={30} showTagline />
        <div className="max-w-lg">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "#18D6C6" }}>
            Reputation work, organized
          </p>
          <h1 className="text-5xl font-bold leading-tight">
            Get more 5-star reviews. Automatically.
          </h1>
          <div className="mt-9 space-y-3">
            {[
              "Auto-send review requests after purchases",
              "Win back unhappy customers with one click",
              "Catch at-risk customers before they churn",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.045] p-4 text-sm" style={{ color: "#D9E0EF" }}>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: "#6F7A94" }}>© 2026 StarLoop</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">
            <Logo height={30} />
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold" style={{ color: "#07142F" }}>Welcome back</h1>
            <p className="mt-2 text-sm" style={{ color: "#5D6880" }}>
              See what needs your attention today.
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
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: "#28354D" }}>Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs hover:underline"
                  style={{ color: "#5D6880" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              {loading ? "Loading..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#5D6880" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: "#07142F" }}>
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
