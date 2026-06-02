"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";

type Step = 1 | 2 | 3 | 4 | 5;

const TOTAL_STEPS = 5;

function ProgressBar({ step }: { step: Step }) {
  return (
    <div style={{ width: "100%", marginBottom: "32px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "8px",
      }}>
        <span style={{ fontSize: "13px", color: "#6B7280" }}>步骤 {step} / {TOTAL_STEPS}</span>
        <span style={{ fontSize: "13px", color: "#6B7280" }}>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div style={{ height: "6px", background: "#E5E7EB", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${(step / TOTAL_STEPS) * 100}%`,
          background: "linear-gradient(90deg, #4A6FFF, #00C9A7)",
          borderRadius: "99px",
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

/* ─── Step 1: Welcome ─────────────────────────────────────────── */
function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "20px",
          background: "linear-gradient(135deg, #4A6FFF, #00C9A7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "36px", margin: "0 auto 20px",
        }}>⭐</div>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#0D1117", marginBottom: "10px", lineHeight: 1.2 }}>
          欢迎使用 StarLoop
        </h1>
        <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.7 }}>
          StarLoop 帮助本地商家把每一位客户变成下一位推荐者。
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
        {[
          { icon: "📱", title: "一键发短信邀评", desc: "自动向客户发送邀评短信，省去手动操作" },
          { icon: "🛡️", title: "服务补救协议", desc: "不满意的客户反馈直达您，方便主动跟进改善服务" },
          { icon: "📊", title: "评分趋势分析", desc: "AI 每月生成报告，找出可改进的问题模式" },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{
            display: "flex", gap: "14px", alignItems: "flex-start",
            padding: "14px 16px", background: "#F9FAFB",
            borderRadius: "12px", border: "1px solid #E5E7EB",
          }}>
            <span style={{ fontSize: "22px", flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#0D1117", marginBottom: "2px" }}>{title}</p>
              <p style={{ fontSize: "13px", color: "#6B7280" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onNext} style={btnPrimary}>
        开始设置 →
      </button>
    </div>
  );
}

/* ─── Step 2: Connect Google (mandatory) ──────────────────────── */
function Step2() {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  function handleConnect() {
    setChecking(true);
    // Redirect to Google OAuth; callback will redirect back to step 3
    window.location.href = "/api/google/connect";
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "20px",
          background: "#EEF3FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "36px", margin: "0 auto 20px",
        }}>🔗</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "8px" }}>
          连接 Google Business（必填）
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>
          连接后，StarLoop 可以自动同步您的 Google 评论，并在客户留下反馈时及时通知您。
        </p>
      </div>

      <div style={{
        background: "#FFF7ED", border: "1px solid #FED7AA",
        borderRadius: "10px", padding: "12px 16px", marginBottom: "24px",
      }}>
        <p style={{ fontSize: "13px", color: "#B76200", margin: 0 }}>
          ⚠️ 这一步必须完成才能继续。连接后会自动跳到下一步。
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
        {["自动同步新评论，无需手动刷新", "客户反馈直达您，方便主动跟进服务", "每月自动生成声誉报告"].map(b => (
          <div key={b} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ color: "#10B981", flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: "14px", color: "#374151" }}>{b}</span>
          </div>
        ))}
      </div>

      {error && <p style={{ fontSize: "13px", color: "#EF4444", marginBottom: "12px" }}>{error}</p>}

      <button onClick={handleConnect} disabled={checking} style={{
        ...btnPrimary,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
      }}>
        <GoogleIcon />
        {checking ? "跳转中..." : "连接 Google Business"}
      </button>
    </div>
  );
}

/* ─── Step 3: Confirm business info ───────────────────────────── */
function Step3({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const CATEGORIES = [
    "餐饮", "清洁", "园艺绿化", "装修翻新", "美甲美容",
    "汽车修理", "水电管道", "搬家服务", "其他",
  ];

  useEffect(() => {
    fetch("/api/business")
      .then(r => r.json())
      .then(d => {
        if (d.name) setName(d.name);
        if (d.category) setCategory(d.category);
        if (d.phone) setPhone(d.phone);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), category, phone: phone.trim() }),
    }).catch(() => {});
    setSaving(false);
    onNext();
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏪</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "6px" }}>
          确认门店信息
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>
          这些信息会出现在发给客户的消息中。
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
        <div>
          <label style={labelStyle}>门店名称 *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：王氏清洁服务"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>门店类型</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            <option value="">选择类型</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>联系电话（选填）</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="例：416-555-0123"
            style={inputStyle}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!name.trim() || saving}
        style={{ ...btnPrimary, opacity: !name.trim() || saving ? 0.5 : 1 }}
      >
        {saving ? "保存中..." : "确认，下一步 →"}
      </button>
    </div>
  );
}

/* ─── Step 4: Service Recovery Protocol setup ─────────────────── */
function Step4({ onNext }: { onNext: () => void }) {
  const [emailAlert, setEmailAlert] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    // Settings stored in user preferences (future enhancement can persist this)
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    onNext();
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🛡️</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "6px" }}>
          设置服务补救协议
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>
          当客户给出较低评分时，StarLoop 会及时通知您，方便主动联系客户改善服务体验。
        </p>
      </div>

      <div style={{
        background: "#F0FDF4", border: "1px solid #A7F3D0",
        borderRadius: "12px", padding: "16px", marginBottom: "24px",
      }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#065F46", marginBottom: "8px" }}>✅ 默认补救流程（已启用）</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            "客户反馈直接发给您，方便跟进",
            "AI 生成服务改进建议",
            "24小时跟进提醒",
            "满意客户可自愿分享 Google 评价",
          ].map(t => (
            <div key={t} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#374151" }}>
              <span style={{ color: "#10B981" }}>→</span> {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: "#fff", border: "1px solid #E5E7EB",
        borderRadius: "12px", padding: "16px", marginBottom: "24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#0D1117", marginBottom: "2px" }}>
              邮件提醒（收到低分反馈时）
            </p>
            <p style={{ fontSize: "12px", color: "#6B7280" }}>立即通知您采取行动</p>
          </div>
          <button
            onClick={() => setEmailAlert(!emailAlert)}
            style={{
              width: "44px", height: "24px",
              borderRadius: "12px", border: "none",
              background: emailAlert ? "#4A6FFF" : "#D1D5DB",
              cursor: "pointer", position: "relative",
              transition: "background 0.2s",
            }}
          >
            <div style={{
              width: "18px", height: "18px",
              borderRadius: "50%", background: "#fff",
              position: "absolute", top: "3px",
              left: emailAlert ? "23px" : "3px",
              transition: "left 0.2s",
            }} />
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={btnPrimary}>
        {saving ? "保存中..." : "完成设置，下一步 →"}
      </button>
    </div>
  );
}

/* ─── Step 5: Send test SMS ───────────────────────────────────── */
function Step5({ onComplete }: { onComplete: () => void }) {
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

  async function handleSend() {
    if (!phone.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/user/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(`发送失败：${data.error}`);
      } else {
        setSent(true);
      }
    } catch {
      setError("发送失败，请稍后重试");
    } finally {
      setSending(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    await fetch("/api/user/complete-onboarding", { method: "POST" });
    onComplete();
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📱</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1117", marginBottom: "6px" }}>
          发一条测试短信给自己
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>
          输入您的手机号，收到测试短信确认一切正常后，设置就完成了！
        </p>
      </div>

      {!sent ? (
        <>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>您的手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="例：+1 416-555-0123"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#EF4444", marginBottom: "12px" }}>{error}</p>
          )}

          <button
            onClick={handleSend}
            disabled={!phone.trim() || sending}
            style={{ ...btnPrimary, opacity: !phone.trim() || sending ? 0.5 : 1, marginBottom: "12px" }}
          >
            {sending ? "发送中..." : "发送测试短信"}
          </button>

          <button
            onClick={handleComplete}
            disabled={completing}
            style={{ ...btnSecondary }}
          >
            {completing ? "完成中..." : "跳过这一步，直接进入 Dashboard →"}
          </button>
        </>
      ) : (
        <>
          <div style={{
            background: "#F0FDF4", border: "1px solid #A7F3D0",
            borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "24px",
          }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#065F46", marginBottom: "4px" }}>
              短信已发送！
            </p>
            <p style={{ fontSize: "13px", color: "#6B7280" }}>
              请检查 {phone} 是否收到测试短信
            </p>
          </div>

          <button
            onClick={handleComplete}
            disabled={completing}
            style={btnPrimary}
          >
            {completing ? "进入中..." : "🎉 进入 Dashboard →"}
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Shared styles ───────────────────────────────────────────── */
const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "14px 20px",
  background: "#0D1117", color: "#fff",
  border: "none", borderRadius: "10px",
  fontSize: "15px", fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  width: "100%", padding: "12px 20px",
  background: "transparent", color: "#6B7280",
  border: "1px solid #E5E7EB", borderRadius: "10px",
  fontSize: "14px", cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  border: "1px solid #E5E7EB", borderRadius: "8px",
  fontSize: "14px", color: "#0D1117",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "13px",
  color: "#374151", marginBottom: "6px", fontWeight: 500,
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/>
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
    </svg>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stepParam = searchParams.get("step");
  const [step, setStep] = useState<Step>(() => {
    const n = parseInt(stepParam ?? "1");
    return (n >= 1 && n <= 5 ? n : 1) as Step;
  });

  function goTo(s: Step) {
    setStep(s);
    window.history.replaceState(null, "", `/en/onboarding?step=${s}`);
    window.scrollTo(0, 0);
  }

  function handleComplete() {
    router.push("/en/dashboard");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F9FAFB",
      fontFamily: "var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 32px", borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <Logo height={22} />
      </div>

      {/* Card */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 24px 80px",
      }}>
        <div style={{
          width: "100%", maxWidth: "480px",
          background: "#fff",
          borderRadius: "20px",
          border: "1px solid #E5E7EB",
          padding: "32px 28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <ProgressBar step={step} />

          {step === 1 && <Step1 onNext={() => goTo(2)} />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 onNext={() => goTo(4)} />}
          {step === 4 && <Step4 onNext={() => goTo(5)} />}
          {step === 5 && <Step5 onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
}
