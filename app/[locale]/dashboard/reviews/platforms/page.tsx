"use client";

import { useState, useEffect } from "react";

interface PlatformData {
  name: string;
  connected: boolean;
  reviewCount: number;
  avgRating: number | null;
  url: string | null;
  valueProposition: string;
}

interface PlatformsResponse {
  businessId: string;
  totalReviews: number;
  overallAvgRating: number | null;
  connectedCount: number;
  totalPlatforms: number;
  platforms: Record<string, PlatformData>;
}

const PLATFORM_ICONS: Record<string, string> = {
  google: "🔍",
  yelp: "⭐",
  facebook: "📘",
  apple_maps: "🍎",
  bbb: "🏆",
  homestars: "🏠",
  healthgrades: "🏥",
  tripadvisor: "✈️",
};

const PLATFORM_KEYS = ["google", "yelp", "facebook", "apple_maps", "bbb", "homestars", "healthgrades", "tripadvisor"];
const PLATFORM_LABELS: Record<string, string> = {
  google: "Google",
  yelp: "Yelp",
  facebook: "Facebook",
  apple_maps: "Apple Maps",
  bbb: "BBB",
  homestars: "HomeStars",
  healthgrades: "Healthgrades",
  tripadvisor: "TripAdvisor",
};

export default function PlatformsPage() {
  const [data, setData] = useState<PlatformsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({
    yelp: "", facebook: "", apple_maps: "", bbb: "", homestars: "", healthgrades: "", tripadvisor: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch("/api/reviews/platforms")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setData(d.data);
          // Pre-fill URL form
          const p = d.data.platforms as Record<string, PlatformData>;
          const filled: Record<string, string> = {};
          for (const key of Object.keys(urls)) {
            filled[key] = p[key]?.url ?? "";
          }
          setUrls(filled);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveUrls() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/business/platform-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(urls),
      });
      const d = await res.json();
      if (d.success) {
        setSaveMsg("Saved! Refresh to see updated status.");
        // Refetch
        const r2 = await fetch("/api/reviews/platforms");
        const d2 = await r2.json();
        if (d2.success) setData(d2.data);
      } else {
        setSaveMsg("Failed to save.");
      }
    } catch {
      setSaveMsg("Error saving.");
    }
    setSaving(false);
  }

  function statusDot(connected: boolean) {
    return connected ? "🟢" : "🔴";
  }

  return (
    <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif", maxWidth: "1000px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0D1117", margin: 0 }}>
          Multi-Platform Review Monitoring
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "4px" }}>
          Track your reputation across all major review platforms.
        </p>
      </div>

      {/* Stats row */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1E3A5F" }}>{data.totalReviews}</div>
            <div style={{ fontSize: "0.8125rem", color: "#6B7280", marginTop: "4px" }}>Total Google Reviews</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1E3A5F" }}>
              {data.overallAvgRating ? `${data.overallAvgRating}★` : "N/A"}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#6B7280", marginTop: "4px" }}>Overall Avg Rating</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1E3A5F" }}>
              {data.connectedCount}/{data.totalPlatforms}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#6B7280", marginTop: "4px" }}>Platforms Connected</div>
          </div>
        </div>
      )}

      {/* Platform cards */}
      {loading ? (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <p style={{ color: "#6B7280" }}>Loading platforms...</p>
        </div>
      ) : data ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {PLATFORM_KEYS.map((key) => {
            const p = data.platforms[key];
            if (!p) return null;
            return (
              <div
                key={key}
                style={{
                  background: "#fff",
                  border: `1px solid ${p.connected ? "#A7F3D0" : "#E5E7EB"}`,
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "24px" }}>{PLATFORM_ICONS[key]}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0D1117" }}>
                        {PLATFORM_LABELS[key]}
                      </div>
                      {p.connected && p.avgRating && (
                        <div style={{ fontSize: "0.75rem", color: "#F59E0B" }}>
                          {"★".repeat(Math.round(p.avgRating))} {p.avgRating}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{statusDot(p.connected)}</span>
                    <span style={{ fontSize: "0.75rem", color: p.connected ? "#059669" : "#9CA3AF" }}>
                      {p.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                </div>
                {p.connected && (
                  <div style={{ fontSize: "0.8125rem", color: "#374151", marginBottom: "8px" }}>
                    {p.reviewCount > 0 ? `${p.reviewCount} reviews` : "0 reviews synced"}
                  </div>
                )}
                <p style={{ fontSize: "0.8125rem", color: "#6B7280", lineHeight: 1.5, margin: 0 }}>
                  {p.valueProposition}
                </p>
                {p.connected && p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block", marginTop: "10px", fontSize: "0.8125rem",
                      color: "#4A6FFF", textDecoration: "none",
                    }}
                  >
                    View profile →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Settings toggle */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px" }}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between",
            width: "100%", background: "none", border: "none", cursor: "pointer",
            fontSize: "0.9375rem", fontWeight: 600, color: "#0D1117",
          }}
        >
          <span>Platform URL Settings</span>
          <span style={{ color: "#9CA3AF" }}>{showSettings ? "▲" : "▼"}</span>
        </button>

        {showSettings && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "16px" }}>
              Add your business profile URLs for each platform to connect them.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              {Object.keys(urls).map((key) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>
                    {PLATFORM_LABELS[key]} URL
                  </label>
                  <input
                    type="url"
                    value={urls[key]}
                    onChange={(e) => setUrls((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`https://...`}
                    style={{
                      width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB",
                      borderRadius: "8px", fontSize: "0.875rem", color: "#0D1117",
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleSaveUrls}
                disabled={saving}
                style={{
                  padding: "10px 24px", background: "#E8734A", color: "#fff",
                  border: "none", borderRadius: "8px", fontWeight: 600,
                  fontSize: "0.875rem", cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Platform URLs"}
              </button>
              {saveMsg && (
                <span style={{ fontSize: "0.875rem", color: saveMsg.includes("Saved") ? "#059669" : "#EF4444" }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
