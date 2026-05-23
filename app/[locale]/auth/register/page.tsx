"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
      router.push("/connect-google");
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
            Start collecting reviews today
          </h1>
          <p style={{
            fontSize: "0.9375rem", color: "#9CA3AF", lineHeight: 1.6,
            marginBottom: "48px",
          }}>
            Free for your first location. No credit card required.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              { title: "Review requests", desc: "Auto-sent via SMS or email at the perfect moment." },
              { title: "Recovery actions", desc: "Win back unhappy customers before they post publicly." },
              { title: "Weekly trust report", desc: "Know exactly what to improve every Monday morning." },
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
            Create your account
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "28px" }}>
            Start collecting reviews in minutes.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{
                  display: "block", fontSize: "0.75rem", fontWeight: 500,
                  color: "#374151", marginBottom: "6px",
                }}>
                  Your name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  placeholder="Jane Smith"
                  style={inputStyle("name")}
                />
              </div>
              <div>
                <label style={{
                  display: "block", fontSize: "0.75rem", fontWeight: 500,
                  color: "#374151", marginBottom: "6px",
                }}>
                  Business name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onFocus={() => setFocused("businessName")}
                  onBlur={() => setFocused(null)}
                  placeholder="Bright Dental"
                  style={inputStyle("businessName")}
                />
              </div>
            </div>
            <div>
              <label style={{
                display: "block", fontSize: "0.75rem", fontWeight: 500,
                color: "#374151", marginBottom: "6px",
              }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="you@example.com"
                style={inputStyle("email")}
              />
            </div>
            <div>
              <label style={{
                display: "block", fontSize: "0.75rem", fontWeight: 500,
                color: "#374151", marginBottom: "6px",
              }}>
                Password
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
              {loading ? "Creating account…" : "Create account"}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9CA3AF" }}>
              Free for 1 location · No credit card required
            </p>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#6B7280", marginTop: "24px" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "#000", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
