"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Zap, MessageSquare, TrendingUp } from "lucide-react";

const PACKAGES = [
  {
    key: "BASIC",
    name: "Starter",
    credits: 100,
    price: "$10",
    unitPrice: "$0.10 / credit",
    description: "Best for getting started",
    badge: null,
  },
  {
    key: "STANDARD",
    name: "Standard",
    credits: 280,
    price: "$25",
    unitPrice: "$0.089 / credit",
    description: "Most popular",
    badge: "Best value",
  },
  {
    key: "PRO",
    name: "Pro",
    credits: 600,
    price: "$50",
    unitPrice: "$0.083 / credit",
    description: "Lowest cost per credit",
    badge: null,
  },
];

interface Transaction {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  createdAt: string;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment");
  const [smsCredits, setSmsCredits] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/credits").then(r => r.json()),
      fetch("/api/user/credit-history").then(r => r.json()),
    ])
      .then(([credits, history]) => {
        setSmsCredits(credits.smsCredits ?? 0);
        setTransactions(history.transactions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePurchase(packageKey: string) {
    if (purchasing) return;
    setPurchasing(packageKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageKey }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPurchasing(null);
    }
  }

  const cardBase: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    cursor: "pointer",
    transition: "box-shadow 0.15s, border-color 0.15s",
    position: "relative",
  };

  return (
    <div style={{ maxWidth: "900px", fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "4px 12px", borderRadius: "99px",
          background: "#EAFBF8", color: "#087C6D",
          fontSize: "12px", fontWeight: 600, marginBottom: "12px",
        }}>
          <CreditCard size={13} />
          SMS Credits
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0D1117", marginBottom: "6px" }}>
          Top up your SMS credits
        </h1>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>
          Pay as you go. No monthly fee. Credits never expire. Click a plan to checkout.
        </p>
      </div>

      {paymentParam === "success" && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "10px", background: "#EAFBF8", border: "1px solid #BDEFE8", color: "#087C6D", fontSize: "14px" }}>
          ✅ Payment successful! Credits have been added to your account.
        </div>
      )}
      {paymentParam === "cancelled" && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "10px", background: "#FFF7ED", border: "1px solid #FED7AA", color: "#B76200", fontSize: "14px" }}>
          Payment cancelled. Your balance was not changed.
        </div>
      )}

      {/* Credit balance */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #4A6FFF, #00C9A7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={22} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "2px" }}>Current SMS balance</p>
            <p style={{ fontSize: "32px", fontWeight: 700, color: "#0D1117", lineHeight: 1 }}>
              {loading ? "—" : (smsCredits ?? 0).toLocaleString()}
              <span style={{ fontSize: "16px", fontWeight: 400, color: "#6B7280", marginLeft: "6px" }}>credits</span>
            </p>
          </div>
        </div>
        {smsCredits !== null && smsCredits < 20 && (
          <div style={{ padding: "8px 14px", borderRadius: "8px", background: "#FFF7ED", border: "1px solid #FED7AA", fontSize: "13px", color: "#B76200" }}>
            ⚠️ Low balance. Top up to keep sending.
          </div>
        )}
      </div>

      {/* Package cards */}
      <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "14px" }}>
        Click a plan to checkout with Stripe
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "36px" }}>
        {PACKAGES.map(pkg => {
          const isSelected = purchasing === pkg.key;
          return (
            <div
              key={pkg.key}
              onClick={() => handlePurchase(pkg.key)}
              style={{
                ...cardBase,
                border: isSelected ? "2px solid #00C9A7" : "1px solid #E5E7EB",
                boxShadow: isSelected ? "0 8px 32px rgba(0,201,167,0.18)" : "0 1px 4px rgba(0,0,0,0.04)",
                opacity: purchasing && !isSelected ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!purchasing) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#00C9A7";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,201,167,0.14)";
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                }
              }}
            >
              {pkg.badge && (
                <div style={{
                  position: "absolute", top: "-12px", left: "20px",
                  padding: "3px 12px", borderRadius: "99px",
                  background: "#00C9A7", color: "#fff",
                  fontSize: "11px", fontWeight: 700,
                }}>
                  {pkg.badge}
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0D1117", marginBottom: "4px" }}>{pkg.name}</h3>
                <p style={{ fontSize: "12px", color: "#6B7280" }}>{pkg.description}</p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "36px", fontWeight: 800, color: "#0D1117", lineHeight: 1 }}>{pkg.price}</div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
                  {pkg.credits.toLocaleString()} credits · {pkg.unitPrice}
                </div>
              </div>

              <div style={{
                width: "100%", padding: "11px",
                background: isSelected ? "#00C9A7" : "#0D1117",
                color: "#fff", border: "none",
                borderRadius: "10px", fontSize: "14px", fontWeight: 600,
                textAlign: "center", transition: "background 0.15s",
              }}>
                {isSelected ? "Redirecting to Stripe…" : `Get ${pkg.credits} credits →`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "36px" }}>
        {[
          { Icon: Zap,        title: "Pay as you go",  text: "No subscription. Credits never expire." },
          { Icon: CreditCard, title: "Secure checkout", text: "Bank-level encryption. No card stored." },
          { Icon: TrendingUp, title: "Save more",       text: "Lower cost per credit on larger plans." },
        ].map(({ Icon, title, text }) => (
          <div key={title} style={{ padding: "16px", borderRadius: "12px", background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <Icon size={16} style={{ color: "#087C6D" }} />
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0D1117", marginTop: "10px", marginBottom: "4px" }}>{title}</p>
            <p style={{ fontSize: "12px", color: "#6B7280" }}>{text}</p>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0D1117", marginBottom: "14px" }}>Transaction history</h2>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>
            {transactions.map((tx, i) => (
              <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < transactions.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <div>
                  <p style={{ fontSize: "14px", color: "#0D1117", marginBottom: "2px" }}>{tx.note ?? tx.type}</p>
                  <p style={{ fontSize: "12px", color: "#9CA3AF" }}>{new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <span style={{ fontSize: "15px", fontWeight: 600, color: tx.amount > 0 ? "#10B981" : "#EF4444" }}>
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} credits
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
