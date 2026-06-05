"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/ui/Logo";

export default function ConnectGooglePage() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "true";

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      window.location.replace("/en/dashboard");
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ padding: "32px 40px" }}>
        <Logo height={24} />
      </div>

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px 80px",
      }}>
        <div style={{ width: "100%", maxWidth: "480px", textAlign: "center" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "20px",
            background: hasError ? "#FEF2F2" : "#F0F4FF",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", margin: "0 auto 24px",
          }}>
            {hasError ? "⚠️" : "🔗"}
          </div>

          <h1 style={{
            fontSize: "2rem", fontWeight: 700, color: "#0D1117",
            lineHeight: 1.2, letterSpacing: "-0.02em",
            marginBottom: "12px",
          }}>
            {hasError ? "Connection failed — please try again" : "Connect Google Business"}
          </h1>

          {hasError ? (
            <p style={{ fontSize: "1rem", color: "#EF4444", lineHeight: 1.6, marginBottom: "32px" }}>
              The Google authorization was not completed. Please click the button below to try again.
            </p>
          ) : (
            <p style={{ fontSize: "1rem", color: "#6B7280", lineHeight: 1.6, marginBottom: "32px" }}>
              StarLoop needs access to your Google Business reviews. This takes 30 seconds.
            </p>
          )}

          {!hasError && (
            <div style={{
              background: "#F9FAFB", border: "1px solid #E5E7EB",
              borderRadius: "12px", padding: "16px 20px",
              marginBottom: "32px", textAlign: "left",
            }}>
              {[
                "Auto-sync Google reviews instantly",
                "Get notified when customers need follow-up",
                "Monthly reputation report generated automatically",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ color: "#10B981", fontSize: "14px", flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "14px", color: "#374151" }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/*
            Use a plain <a> tag so the browser does a full navigation to the API
            endpoint, which then 302-redirects to Google's OAuth consent screen.
            This avoids any React state / JS timing issues.

            IMPORTANT: Railway must have GOOGLE_REDIRECT_URI set to:
            https://starloop-production.up.railway.app/api/google/callback
            (NOT /api/auth/callback/google — that is NextAuth's own login callback)
          */}
          <a
            href="/api/google/connect"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              gap: "10px", width: "100%", height: "52px",
              background: "#0D1117", color: "#fff",
              border: "none", borderRadius: "10px",
              fontSize: "1rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              textDecoration: "none",
              transition: "opacity 150ms",
              marginBottom: "16px",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <GoogleIcon />
            Connect Google Business →
          </a>

          <p style={{ fontSize: "0.8125rem", color: "#9CA3AF" }}>
            You can disconnect anytime in Settings
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
    </svg>
  );
}
