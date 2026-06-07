"use client";

import { useState, useEffect } from "react";

interface ChecklistItem {
  key: string;
  label: string;
  status: "green" | "yellow" | "red";
  tip: string;
  passed: boolean;
}

interface ChecklistData {
  completenessScore: number;
  passedCount: number;
  totalItems: number;
  items: ChecklistItem[];
  recommendation: string;
  businessName: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface SchemaData {
  description: string;
  faqs: FAQ[];
  scriptTag: string;
}

const STATUS_ICON: Record<string, string> = {
  green: "✅",
  yellow: "⚠️",
  red: "❌",
};

function CircularProgress({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ position: "relative", width: "140px", height: "140px" }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none" stroke="#E8734A" strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1E3A5F" }}>{score}%</span>
        <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>Complete</span>
      </div>
    </div>
  );
}

export default function GEOPage() {
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "faqs">("profile");
  const [copied, setCopied] = useState(false);
  const [businessSlug, setBusinessSlug] = useState<string>("");

  useEffect(() => {
    fetch("/api/geo/checklist")
      .then(r => r.json())
      .then(d => { if (d.success) setChecklist(d.data); })
      .catch(console.error)
      .finally(() => setLoadingChecklist(false));

    fetch("/api/business")
      .then(r => r.json())
      .then(d => { if (d?.slug) setBusinessSlug(d.slug); })
      .catch(() => {});

    fetch("/api/geo/schema")
      .then(r => r.json())
      .then(d => { if (d.success) setSchema(d.data); })
      .catch(console.error)
      .finally(() => setLoadingSchema(false));
  }, []);

  function copyFAQs() {
    if (!schema) return;
    const text = schema.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const profileUrl = businessSlug
    ? `${typeof window !== "undefined" ? window.location.origin : "https://starloop.app"}/r/${businessSlug}`
    : null;

  return (
    <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif", maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0D1117", margin: 0 }}>
          AI Search Visibility
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "4px" }}>
          When customers ask ChatGPT or Perplexity "best [business type] near me", complete business info helps AI recommend you.
        </p>
      </div>

      {/* Score + recommendation */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "28px", display: "flex", gap: "32px", alignItems: "center", marginBottom: "24px" }}>
        {loadingChecklist ? (
          <div style={{ color: "#9CA3AF" }}>Loading...</div>
        ) : checklist ? (
          <>
            <CircularProgress score={checklist.completenessScore} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0D1117", marginBottom: "8px" }}>
                {checklist.passedCount}/{checklist.totalItems} items complete
              </div>
              <p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.6, marginBottom: "12px" }}>
                {checklist.recommendation}
              </p>
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "8px", padding: "12px 16px", fontSize: "0.8125rem", color: "#1D4ED8" }}>
                AI search tools rank local businesses based on structured data, reviews, and consistent online presence. A higher score means more AI-driven referrals.
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: "#EF4444" }}>Failed to load checklist.</p>
        )}
      </div>

      {/* 8-item checklist */}
      {checklist && (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#0D1117", marginBottom: "16px" }}>
            GBP Completeness Checklist
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {checklist.items.map(item => (
              <div
                key={item.key}
                style={{
                  display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px", borderRadius: "8px",
                  background: item.passed ? "#F0FDF4" : item.status === "yellow" ? "#FFFBEB" : "#FEF2F2",
                  border: `1px solid ${item.passed ? "#A7F3D0" : item.status === "yellow" ? "#FDE68A" : "#FECACA"}`,
                }}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{STATUS_ICON[item.status]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0D1117", marginBottom: "2px" }}>{item.label}</div>
                  {!item.passed && <div style={{ fontSize: "0.8125rem", color: "#6B7280" }}>{item.tip}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB" }}>
          {([
            { key: "profile", label: "AI Search Profile" },
            { key: "faqs",    label: "AI Q&A Content" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: "14px", fontSize: "0.875rem",
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? "#0D1117" : "#6B7280",
                background: "none", border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #E8734A" : "2px solid transparent",
                marginBottom: "-1px", cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px" }}>
          {activeTab === "profile" ? (
            /* ── AI Search Profile tab ── */
            <div>
              {/* Success banner */}
              <div style={{
                background: "#F0FDF4", border: "1px solid #A7F3D0",
                borderRadius: "12px", padding: "20px 24px", marginBottom: "24px",
                display: "flex", gap: "16px", alignItems: "flex-start",
              }}>
                <span style={{ fontSize: "24px", flexShrink: 0 }}>✅</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#065F46", marginBottom: "6px" }}>
                    Your AI Search Profile has been automatically generated
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.65 }}>
                    StarLoop has created an AI-readable public profile page for your business.
                    ChatGPT, Perplexity, and other AI tools can directly read your business information.
                    <strong> No action required — the system maintains this automatically.</strong>
                  </p>
                </div>
              </div>

              {/* Profile page link */}
              {profileUrl ? (
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0D1117", marginBottom: "10px" }}>
                    Your public AI-readable profile:
                  </p>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    background: "#F9FAFB", border: "1px solid #E5E7EB",
                    borderRadius: "10px", padding: "12px 16px",
                  }}>
                    <span style={{ flex: 1, fontSize: "0.875rem", color: "#374151", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {profileUrl}
                    </span>
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "8px 18px", background: "#E8734A", color: "#fff",
                        borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 600,
                        textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                      }}
                    >
                      Preview Profile →
                    </a>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "8px" }}>
                    This page contains structured business data (JSON-LD) that AI engines can parse automatically.
                  </p>
                </div>
              ) : (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "16px", fontSize: "0.875rem", color: "#92400E" }}>
                  ⚠️ Set a URL slug in{" "}
                  <a href="/en/dashboard/settings" style={{ color: "#D97706", fontWeight: 600 }}>Settings → Business Profile</a>
                  {" "}to activate your public AI-readable profile page.
                </div>
              )}

              {/* How it works info box */}
              <div style={{ marginTop: "24px", background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "16px" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>How AI Search Profile works</p>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.8125rem", color: "#6B7280", lineHeight: 1.75 }}>
                  <li>Your profile page includes structured data (JSON-LD) that AI search engines can read</li>
                  <li>When customers ask AI "best [service] near me", your complete profile improves discoverability</li>
                  <li>StarLoop auto-updates the profile when you add reviews or update business info</li>
                </ul>
              </div>
            </div>
          ) : (
            /* ── AI Q&A Content tab ── */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0D1117", marginBottom: "4px" }}>
                    AI Q&A Content
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "#6B7280" }}>
                    The following content is automatically included in your profile page — no action needed.
                  </p>
                </div>
                <button
                  onClick={copyFAQs}
                  disabled={!schema}
                  style={{
                    padding: "8px 16px", background: "#E8734A", color: "#fff",
                    border: "none", borderRadius: "8px", fontWeight: 600,
                    fontSize: "0.8125rem", cursor: schema ? "pointer" : "not-allowed",
                    opacity: schema ? 1 : 0.5, flexShrink: 0,
                  }}
                >
                  {copied ? "Copied!" : "Copy All"}
                </button>
              </div>

              {loadingSchema ? (
                <p style={{ color: "#9CA3AF", textAlign: "center", padding: "32px" }}>Generating with AI...</p>
              ) : schema ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {schema.faqs.map((faq, i) => (
                    <div key={i} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px", background: "#F9FAFB" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0D1117", marginBottom: "6px" }}>
                        {faq.question}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.6 }}>
                        {faq.answer}
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "4px" }}>
                    These Q&As are embedded in your profile page and help AI tools surface accurate information about your business.
                  </p>
                </div>
              ) : (
                <p style={{ color: "#9CA3AF" }}>Could not load Q&A content.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
