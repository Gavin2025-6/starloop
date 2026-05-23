"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, ShieldCheck, Sparkles, Zap } from "lucide-react";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    description: "Validate one business loop",
    features: ["Public feedback page", "10 SMS requests/month", "Basic recovery trial"],
    action: "Current plan",
  },
  {
    key: "STARTER",
    name: "Starter",
    price: "$49/mo",
    description: "For owners sending requests every week",
    features: ["More feedback requests", "Owner action queue", "Auto-language customer pages", "Basic alerts"],
    action: "Upgrade to Starter",
    badge: "Launch plan",
  },
  {
    key: "PRO",
    name: "Growth",
    price: "$149/mo",
    description: "For reputation work that runs daily",
    features: ["Automated follow-ups", "Recovery inbox", "Weekly trust report", "Category playbooks"],
    action: "Upgrade to Growth",
    featured: true,
  },
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment");
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [selectedPlan, setSelectedPlan] = useState("FREE");
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => {
        const plan = d.plan ?? "FREE";
        setCurrentPlan(plan);
        setSelectedPlan(plan);
      })
      .catch(() => {})
      .finally(() => setLoadingPlan(false));
  }, []);

  async function handleUpgrade(planKey: string) {
    setSelectedPlan(planKey);
    setUpgrading(planKey);
    try {
      if (currentPlan !== "FREE") {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setUpgrading(null);
    }
  }

  return (
    <div className="max-w-6xl" style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#EAFBF8", color: "#087C6D" }}>
            <CreditCard size={14} />
            Billing
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#0D1117" }}>Upgrade when StarLoop saves real work.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "#6B7280" }}>
            Start free, then upgrade when request volume, recovery work, and reporting become part of daily operations.
          </p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3 text-sm" style={{ border: "1px solid #E5E7EB", color: "#4B5563" }}>
          Current plan: <span className="font-semibold" style={{ color: "#0D1117" }}>{loadingPlan ? "Loading..." : currentPlan}</span>
        </div>
      </div>

      {paymentParam === "success" && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#EAFBF8", border: "1px solid #BDEFE8", color: "#087C6D" }}>
          Payment successful. Your plan has been updated.
        </div>
      )}
      {paymentParam === "cancelled" && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#B76200" }}>
          Payment cancelled. Your plan was not changed.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isSelected = selectedPlan === plan.key;
          const isPaid = plan.key !== "FREE";
          const isFeatured = !!plan.featured;

          return (
            <div
              key={plan.key}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlan(plan.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedPlan(plan.key);
                }
              }}
              className="relative rounded-2xl bg-white p-6 transition-all"
              style={{
                border: isSelected ? "2px solid #3157D5" : isFeatured ? "2px solid #0D1117" : "1px solid #E5E7EB",
                boxShadow: isSelected ? "0 18px 48px rgba(49,87,213,0.18)" : isFeatured ? "0 20px 60px rgba(15,23,42,0.14)" : "0 8px 28px rgba(15,23,42,0.05)",
                background: isSelected ? "#F7F9FF" : "#FFFFFF",
                cursor: "pointer",
              }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#0D1117", color: "#FFFFFF" }}>
                  {plan.badge}
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#0D1117" }}>{plan.name}</h2>
                  <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>{plan.description}</p>
                </div>
                {isCurrent && (
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "#EEF3FF", color: "#3157D5" }}>
                    Current
                  </span>
                )}
                <span
                  aria-label={isSelected ? "Selected plan" : "Select plan"}
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{
                    border: isSelected ? "1px solid #3157D5" : "1px solid #D1D5DB",
                    background: isSelected ? "#3157D5" : "#FFFFFF",
                    color: "#FFFFFF",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <Check size={15} />}
                </span>
              </div>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-bold" style={{ color: "#0D1117" }}>{plan.price.replace("/mo", "")}</span>
                {plan.price.includes("/mo") && <span className="pb-1 text-sm" style={{ color: "#6B7280" }}>/mo</span>}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm" style={{ color: "#4B5563" }}>
                    <Check size={16} style={{ color: "#10B981", marginTop: 2, flexShrink: 0 }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent || upgrading === plan.key}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPaid) handleUpgrade(plan.key);
                }}
                className="mt-7 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: isFeatured ? "#0D1117" : isPaid ? "linear-gradient(135deg, #00C9A7, #4A6FFF)" : "#F3F4F6",
                  color: isPaid ? "#FFFFFF" : "#6B7280",
                  border: "none",
                }}
              >
                {upgrading === plan.key ? "Opening checkout..." : isCurrent ? "Current plan" : plan.action}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {[
          { Icon: Zap, title: "Upgrade only when usage proves value", text: "Free users can explore the loop before seeing paid plans in the product." },
          { Icon: ShieldCheck, title: "Stripe handles payment securely", text: "Subscriptions, cards, and receipts stay inside Stripe checkout and billing portal." },
          { Icon: Sparkles, title: "Limits create natural upgrade moments", text: "When a business needs more requests or automation, StarLoop prompts the owner at the right time." },
        ].map(({ Icon, title, text }) => (
          <div key={title} className="rounded-xl bg-white p-4" style={{ border: "1px solid #E5E7EB" }}>
            <Icon size={18} style={{ color: "#087C6D" }} />
            <p className="mt-3 text-sm font-semibold" style={{ color: "#0D1117" }}>{title}</p>
            <p className="mt-1 text-xs leading-5" style={{ color: "#6B7280" }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
