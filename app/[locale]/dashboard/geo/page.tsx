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
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#E8734A"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<"structured" | "faqs">("structured");
  const [copied, setCopied] = useState(false);
  const [schemaLoaded, setSchemaLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/geo/checklist")
      .then((r) => r.json())
      .then((d) => { if (d.success) setChecklist(d.data); })
      .catch(console.error)
      .finally(() => setLoadingChecklist(false));
  }, []);

  async function loadSchema() {
    if (schemaLoaded) return;
    setLoadingSchema(true);
    try {
      const r = await fetch("/api/geo/schema");
      const d = await r.json();
      if (d.success) {
        setSchema(d.data);
        setSchemaLoaded(true);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingSchema(false);
  }

  useEffect(() => {
    loadSchema();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif", maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0D1117", margin: 0 }}>
          AI Search Visibility
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "4px" }}>
          Optimize your business for AI assistants like ChatGPT, Perplexity, and Google AI Overview.
        </p>
      </div>

      {/* Top section: progress + recommendation */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "28px",
          display: "flex",
          gap: "32px",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
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
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "0.8125rem",
                  color: "#1D4ED8",
                }}
              >
                AI search tools like ChatGPT and Perplexity rank local businesses based on structured data,
                reviews, and consistent online presence. A higher completeness score means more AI-driven referrals.
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: "#EF4444" }}>Failed to load checklist.</p>
        )}
      </div>

      {/* 8-item checklist */}
      {checklist && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#0D1117", marginBottom: "16px" }}>
            GBP Completeness Checklist
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {checklist.items.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  padding: "12px",
                  borderRadius: "8px",
                  background: item.passed ? "#F0FDF4" : item.status === "yellow" ? "#FFFBEB" : "#FEF2F2",
                  border: `1px solid ${item.passed ? "#A7F3D0" : item.status === "yellow" ? "#FDE68A" : "#FECACA"}`,
                }}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{STATUS_ICON[item.status]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0D1117", marginBottom: "2px" }}>
                    {item.label}
                  </div>
                  {!item.passed && (
                    <div style={{ fontSize: "0.8125rem", color: "#6B7280" }}>{item.tip}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs: Structured Data + FAQs */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB" }}>
          {(["structured", "faqs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === "structured" || tab === "faqs") loadSchema(); }}
              style={{
                flex: 1,
                padding: "14px",
                fontSize: "0.875rem",
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? "#0D1117" : "#6B7280",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #E8734A" : "2px solid transparent",
                marginBottom: "-1px",
                cursor: "pointer",
              }}
            >
              {tab === "structured" ? "Structured Data (JSON-LD)" : "AI-Ready FAQs"}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px" }}>
          {loadingSchema ? (
            <p style={{ color: "#9CA3AF", textAlign: "center" }}>Generating with AI...</p>
          ) : !schema ? (
            <p style={{ color: "#9CA3AF" }}>Schema not loaded.</p>
          ) : activeTab === "structured" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>
                  Add this to your website&apos;s {"<head>"} to help AI search engines understand your business.
                </p>
                <button
                  onClick={() => copyToClipboard(schema.scriptTag)}
                  style={{
                    padding: "8px 16px",
                    background: "#E8734A",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    flexShrink: 0,
                    marginLeft: "12px",
                  }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "0.8125rem",
                  color: "#374151",
                  overflowX: "auto",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {schema.scriptTag}
              </pre>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>
                  AI-generated FAQs that match how customers search for your service.
                </p>
                <button
                  onClick={() => copyToClipboard(schema.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n"))}
                  style={{
                    padding: "8px 16px",
                    background: "#E8734A",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    flexShrink: 0,
                    marginLeft: "12px",
                  }}
                >
                  {copied ? "Copied!" : "Copy All"}
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {schema.faqs.map((faq, i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "#F9FAFB",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0D1117", marginBottom: "6px" }}>
                      {faq.question}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.6 }}>
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
