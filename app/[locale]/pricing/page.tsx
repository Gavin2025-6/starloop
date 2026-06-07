"use client";

import { useState } from "react";
import Logo from "@/components/ui/Logo";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  ctaHref: string;
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with the essentials.",
    highlight: false,
    cta: "Get started free",
    ctaHref: "/en/auth/register",
    features: [
      { text: "10 SMS invites/month", included: true },
      { text: "Basic AI reply (1 version)", included: true },
      { text: "ROI numbers (no chart)", included: true },
      { text: "1 platform monitoring (Google)", included: true },
      { text: "Customer profiles", included: false },
      { text: "Lifecycle outreach", included: false },
      { text: "8-platform monitoring", included: false },
      { text: "GBP completeness check", included: false },
      { text: "Referral system", included: false },
      { text: "GEO structured data", included: false },
    ],
  },
  {
    name: "Growth",
    price: "$49",
    period: "/month",
    badge: "RECOMMENDED",
    description: "The complete reputation growth system.",
    highlight: true,
    cta: "Start Growth plan",
    ctaHref: "/en/dashboard/billing",
    features: [
      { text: "Unlimited SMS invites", included: true },
      { text: "AI reply — both versions + all platform formats", included: true },
      { text: "Full ROI Dashboard with trend chart", included: true },
      { text: "Customer profiles + lifecycle outreach", included: true },
      { text: "8-platform review monitoring", included: true },
      { text: "GBP completeness check + recommendations", included: true },
      { text: "Monthly reputation reports", included: true },
      { text: "Referral system", included: false },
      { text: "GEO structured data auto-generation", included: false },
    ],
  },
  {
    name: "Scale",
    price: "$99",
    period: "/month",
    description: "Everything in Growth, plus referral and GEO.",
    highlight: false,
    cta: "Start Scale plan",
    ctaHref: "/en/dashboard/billing",
    features: [
      { text: "Everything in Growth", included: true },
      { text: "Referral link system", included: true },
      { text: "GEO structured data auto-generation", included: true },
      { text: "AI-generated FAQ schema", included: true },
      { text: "Priority support", included: true },
      { text: "API access (coming soon)", included: true },
    ],
  },
];

function CheckIcon({ included }: { included: boolean }) {
  if (included) {
    return <span style={{ color: "#10B981", fontWeight: 700, flexShrink: 0 }}>✓</span>;
  }
  return <span style={{ color: "#D1D5DB", flexShrink: 0 }}>—</span>;
}

export default function PricingPage() {
  const [monthlyCustomers, setMonthlyCustomers] = useState("");
  const [avgTransaction, setAvgTransaction] = useState("");

  const estimatedValue =
    monthlyCustomers && avgTransaction
      ? (Number(monthlyCustomers) * 0.25 * 0.3 * Number(avgTransaction)).toFixed(0)
      : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Nav */}
      <div
        style={{
          padding: "16px 32px",
          borderBottom: "1px solid #E5E7EB",
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Logo height={24} />
        <a
          href="/en/dashboard"
          style={{ fontSize: "0.875rem", color: "#6B7280", textDecoration: "none" }}
        >
          Back to dashboard
        </a>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "64px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: "#1E3A5F",
              marginBottom: "12px",
              letterSpacing: "-0.03em",
            }}
          >
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: "1.125rem", color: "#6B7280", maxWidth: "540px", margin: "0 auto 8px" }}>
            For local service businesses with $8,000–$50,000 monthly revenue.
          </p>
          <p style={{ fontSize: "0.875rem", color: "#9CA3AF" }}>
            No setup fees. Cancel anytime.
          </p>
        </div>

        {/* Plans grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            marginBottom: "64px",
            alignItems: "start",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: "#fff",
                border: plan.highlight ? "2px solid #E8734A" : "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "32px 28px",
                position: "relative",
              }}
            >
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#E8734A",
                    color: "#fff",
                    padding: "4px 16px",
                    borderRadius: "99px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0D1117", marginBottom: "8px" }}>
                  {plan.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1E3A5F" }}>{plan.price}</span>
                  <span style={{ fontSize: "0.875rem", color: "#9CA3AF" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "8px" }}>{plan.description}</p>
              </div>

              <a
                href={plan.ctaHref}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  marginBottom: "24px",
                  background: plan.highlight ? "#E8734A" : "transparent",
                  color: plan.highlight ? "#fff" : "#1E3A5F",
                  border: plan.highlight ? "none" : "2px solid #1E3A5F",
                }}
              >
                {plan.cta}
              </a>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <CheckIcon included={f.included} />
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: f.included ? "#374151" : "#9CA3AF",
                        lineHeight: 1.4,
                      }}
                    >
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ROI Estimator */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "16px",
            padding: "40px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1E3A5F",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            ROI Estimator
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6B7280",
              textAlign: "center",
              marginBottom: "28px",
            }}
          >
            See how much value StarLoop could add to your business.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Monthly customers served
              </label>
              <input
                type="number"
                value={monthlyCustomers}
                onChange={(e) => setMonthlyCustomers(e.target.value)}
                placeholder="e.g. 50"
                min="0"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "0.9375rem",
                  color: "#0D1117",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Average transaction value ($)
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9CA3AF",
                    fontSize: "0.9375rem",
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  value={avgTransaction}
                  onChange={(e) => setAvgTransaction(e.target.value)}
                  placeholder="e.g. 150"
                  min="0"
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 28px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "0.9375rem",
                    color: "#0D1117",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {estimatedValue ? (
            <div
              style={{
                background: "linear-gradient(135deg, #E8734A, #D4623C)",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                color: "#fff",
              }}
            >
              <div style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "8px" }}>
                Growth plan estimated monthly value
              </div>
              <div style={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1 }}>
                ${Number(estimatedValue).toLocaleString()}
              </div>
              <div style={{ fontSize: "0.8125rem", opacity: 0.8, marginTop: "8px" }}>
                {monthlyCustomers} customers × 25% review rate × 30% new referrals × ${avgTransaction}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#F8FAFC",
                border: "1px dashed #E5E7EB",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                color: "#9CA3AF",
              }}
            >
              Enter your numbers above to see your estimated monthly value
            </div>
          )}

          <p style={{ fontSize: "0.75rem", color: "#9CA3AF", textAlign: "center", marginTop: "12px" }}>
            Estimate based on 25% of reviewed customers generating new referrals, at 30% conversion.
          </p>
        </div>
      </div>
    </div>
  );
}
