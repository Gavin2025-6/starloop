"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  function checkPassword(pwd: string) {
    setPasswordChecks({
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]/.test(pwd),
    });
  }

  const metCount = Object.values(passwordChecks).filter(Boolean).length;
  const allMet = metCount === 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!allMet) {
      setError("Password does not meet all requirements");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not reset password. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    boxSizing: "border-box",
    height: "44px",
    padding: "0 12px",
    fontSize: "0.875rem",
    color: "#000",
    background: "#fff",
    border: `1px solid ${focused === name ? "#000" : "#E5E7EB"}`,
    borderRadius: "6px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 150ms, box-shadow 150ms",
    boxShadow: focused === name ? "0 0 0 3px rgba(0,0,0,0.06)" : "none",
  });

  const btnStyle = (disabled?: boolean): React.CSSProperties => ({
    width: "100%",
    height: "44px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "opacity 150ms",
    fontFamily: "inherit",
  });

  if (!token) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#fff",
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "40px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "#FEF2F2", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 20px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#000", marginBottom: "8px" }}>
            Invalid reset link
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", lineHeight: 1.6, marginBottom: "24px" }}>
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            style={{
              display: "inline-block",
              height: "44px",
              lineHeight: "44px",
              padding: "0 24px",
              background: "#000",
              color: "#fff",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#fff",
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "40px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "#F0FDF4", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 20px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#000", marginBottom: "8px" }}>
            Password reset successful!
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", lineHeight: 1.6 }}>
            Redirecting you to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Left — black panel 40% */}
      <div style={{
        flex: "0 0 40%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 64px",
        background: "#000",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: "32px", left: "40px" }}>
          <Logo variant="dark" height={26} />
        </div>
        <div style={{ maxWidth: "400px" }}>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            marginBottom: "20px",
          }}>
            Choose a strong password
          </h1>
          <p style={{
            fontSize: "0.9375rem", color: "#9CA3AF", lineHeight: 1.6,
            marginBottom: "48px",
          }}>
            Make it at least 8 characters with a mix of upper and lowercase letters, numbers, and symbols.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              { title: "8+ characters", desc: "Longer passwords are harder to crack." },
              { title: "Mix it up", desc: "Use uppercase, lowercase, numbers, and special characters." },
              { title: "Don't reuse", desc: "Use a password you don't use on other sites." },
            ].map(({ title, desc }) => (
              <div key={title} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>{title}</div>
                  <div style={{ fontSize: "0.8125rem", color: "#9CA3AF", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — white panel 60% */}
      <div style={{
        flex: "0 0 60%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        padding: "40px",
      }}>
        <div style={{ width: "360px" }}>
          <h2 style={{
            fontSize: "1.5rem", fontWeight: 700, color: "#000",
            letterSpacing: "-0.02em", marginBottom: "8px",
          }}>
            Reset your password
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "28px" }}>
            Choose a new password for your account.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{
                display: "block", fontSize: "0.75rem", fontWeight: 500,
                color: "#374151", marginBottom: "6px",
              }}>
                New password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); checkPassword(e.target.value); }}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                style={inputStyle("password")}
              />
              {password.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: "2px", borderRadius: "1px",
                        background: i <= metCount ? "#000" : "#E5E7EB",
                        transition: "background 200ms",
                      }}/>
                    ))}
                  </div>
                  <p style={{
                    fontSize: "0.6875rem", fontWeight: 500,
                    color: allMet ? "#000" : "#6B7280",
                    marginBottom: !allMet && password.length > 0 ? "6px" : "0",
                    transition: "color 150ms",
                  }}>
                    {allMet ? "Strong password" : metCount <= 2 ? "Weak" : "Fair"}
                  </p>
                  {!allMet && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                      {[
                        { met: passwordChecks.minLength, text: "At least 8 characters" },
                        { met: passwordChecks.hasUpper, text: "One uppercase letter" },
                        { met: passwordChecks.hasLower, text: "One lowercase letter" },
                        { met: passwordChecks.hasNumber, text: "One number" },
                        { met: passwordChecks.hasSpecial, text: "One special character" },
                      ].map(({ met, text }) => (
                        <span key={text} style={{
                          fontSize: "0.6875rem",
                          color: met ? "#9CA3AF" : "#6B7280",
                          textDecoration: met ? "line-through" : "none",
                          transition: "color 150ms",
                        }}>
                          {text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={{
                display: "block", fontSize: "0.75rem", fontWeight: 500,
                color: "#374151", marginBottom: "6px",
              }}>
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocused("confirmPassword")}
                onBlur={() => setFocused(null)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                style={inputStyle("confirmPassword")}
              />
            </div>
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: "6px",
                background: "#FEF2F2", border: "1px solid #FECACA",
                fontSize: "0.8125rem", color: "#DC2626",
              }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !allMet}
              style={btnStyle(loading || !allMet)}
              onMouseEnter={(e) => { if (!loading && allMet) e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { if (!loading && allMet) e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#6B7280", marginTop: "24px" }}>
            <Link href="/auth/login" style={{ color: "#000", fontWeight: 600, textDecoration: "none" }}>
              &larr; Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#fff",
      }}>
        <p style={{ color: "#6B7280" }}>Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
