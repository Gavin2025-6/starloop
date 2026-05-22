"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
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
      router.push("/en/onboarding");
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
    border: `1px solid ${focused === name ? "#000" : "#E5E5E5"}`,
    borderRadius: "6px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxShadow: focused === name ? "0 0 0 3px rgba(0,0,0,0.06)" : "none",
  });

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#fff",
    }}>
      {/* Left panel */}
      <div style={{
        flex: "0 0 48%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 80px",
        background: "#FAFAFA",
        borderRight: "1px solid #F0F0F0",
      }}>
        <div style={{ position: "absolute", top: "32px", left: "40px" }}>
          <Logo height={26} />
        </div>
        <div style={{ maxWidth: "420px" }}>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#000",
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            marginBottom: "16px",
          }}>
            Start collecting reviews today
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "#666", lineHeight: 1.6, marginBottom: "40px" }}>
            Free for your first location. No credit card required.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                title: "Review requests",
                desc: "Auto-sent at the perfect moment via SMS or email.",
              },
              {
                title: "Recovery actions",
                desc: "Win back unhappy customers before they post.",
              },
              {
                title: "Weekly trust report",
                desc: "Know exactly what to improve every Monday.",
              },
            ].map(({ title, desc }) => (
              <div key={title} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "4px",
                  background: "#000", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0, marginTop: "2px",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#000", marginBottom: "2px" }}>{title}</div>
                  <div style={{ fontSize: "0.8125rem", color: "#888", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: "0 0 52%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        background: "#fff",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <h2 style={{
            fontSize: "1.5rem", fontWeight: 700, color: "#000",
            letterSpacing: "-0.02em", marginBottom: "6px",
          }}>
            Create your account
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#888", marginBottom: "28px" }}>
            Start collecting reviews in minutes.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{
                  display: "block", fontSize: "0.75rem", fontWeight: 500,
                  color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em",
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
                  color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em",
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
                color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em",
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
                color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em",
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
              {/* Password strength */}
              {password.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{
                    display: "flex", gap: "4px", marginBottom: "6px",
                  }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: "2px", borderRadius: "1px",
                        background: i <= metCount
                          ? metCount <= 2 ? "#EAB308" : metCount <= 3 ? "#EAB308" : "#22C55E"
                          : "#EEE",
                        transition: "background 0.3s",
                      }}/>
                    ))}
                  </div>
                  <p style={{
                    fontSize: "0.6875rem", fontWeight: 500,
                    color: metCount <= 2 ? "#A3A300" : metCount <= 3 ? "#CA8A04" : "#16A34A",
                    marginBottom: metCount < 5 ? "6px" : "0",
                    transition: "color 0.2s",
                  }}>
                    {metCount <= 2 ? "Weak" : metCount <= 3 ? "Fair" : "Strong"}{allMet ? " — your password is ready" : ""}
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
                          color: met ? "#999" : "#666",
                          textDecoration: met ? "line-through" : "none",
                          transition: "color 0.2s",
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
                background: "#FFF5F5", border: "1px solid #FED7D7",
                fontSize: "0.8125rem", color: "#C53030",
              }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !allMet}
              style={{
                width: "100%", height: "44px",
                background: "#000", color: "#fff",
                border: "none", borderRadius: "6px",
                fontSize: "0.875rem", fontWeight: 600,
                cursor: loading || !allMet ? "not-allowed" : "pointer",
                opacity: loading || !allMet ? 0.5 : 1,
                transition: "transform 0.1s, opacity 0.15s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { if (!loading && allMet) e.currentTarget.style.transform = "scale(1.01)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#BBB" }}>
              Free for 1 location · No credit card required
            </p>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#888", marginTop: "20px" }}>
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
