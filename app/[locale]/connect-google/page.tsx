"use client";

import Logo from "@/components/ui/Logo";

export default function ConnectGooglePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Logo top-left */}
      <div style={{ padding: "32px 40px" }}>
        <Logo height={24} />
      </div>

      {/* Centered content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px 80px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "480px",
          textAlign: "center",
        }}>
          <h1 style={{
            fontSize: "2.5rem", fontWeight: 700, color: "#000",
            lineHeight: 1.15, letterSpacing: "-0.03em",
            marginBottom: "16px",
          }}>
            Connect your Google Business
          </h1>
          <p style={{
            fontSize: "1rem", color: "#6B7280", lineHeight: 1.6,
            marginBottom: "48px",
          }}>
            StarLoop needs access to your reviews to get started. This takes 30 seconds.
          </p>

          <a
            href="/api/google/connect"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "100%", height: "52px",
              background: "#000", color: "#fff",
              border: "none", borderRadius: "8px",
              fontSize: "1rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              textDecoration: "none",
              transition: "opacity 150ms",
              marginBottom: "32px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Connect Google Business →
          </a>

          <p style={{ fontSize: "0.8125rem", color: "#9CA3AF" }}>
            You can reconnect or disconnect anytime in Settings
          </p>
        </div>
      </div>
    </div>
  );
}
