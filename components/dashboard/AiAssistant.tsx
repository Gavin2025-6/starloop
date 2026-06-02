"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: { label: string; href: string };
}

interface KnowledgeEntry {
  keywords: string[];
  reply: string;
  action?: { label: string; href: string };
}

const KNOWLEDGE: KnowledgeEntry[] = [
  // How to connect Google
  {
    keywords: ["connect", "google", "google business", "sync", "gmb", "连接", "谷歌", "断开"],
    reply: "连接 Google Business：进入 Settings（设置），找到 Google Connection 区域，点击 Connect 按钮，使用您的 Google 账号授权即可。连接后 StarLoop 会自动同步新评论。\n\n如果 Google 连接断开了，同样去 Settings 重新连接。",
    action: { label: "前往设置 →", href: "/dashboard/settings" }
  },
  // How to top up SMS credits
  {
    keywords: ["credit", "recharge", "top up", "buy sms", "充值", "余额", "购买短信", "billing", "pay", "payment"],
    reply: "充值短信额度：进入 Billing（充值）页面，选择适合您的套餐：\n• 基础包：$10 = 100 条\n• 标准包：$25 = 280 条（最划算）\n• 专业包：$50 = 600 条\n\n支付成功后额度立即到账，永不过期。",
    action: { label: "前往充值 →", href: "/dashboard/billing" }
  },
  // Service Recovery Protocol setup
  {
    keywords: ["service recovery", "recovery protocol", "服务补救", "补救流程", "setup", "configure", "设置", "how does it work", "怎么用"],
    reply: "服务补救协议的工作原理：\n1. 您发短信邀请客户分享体验\n2. 客户点链接后留下评分和反馈\n3. 满意的客户可以自愿前往 Google 分享评价\n4. 不满意的客户反馈直接发给您，方便主动跟进\n5. 联系客户，改善服务体验，提升满意度\n\n在 Review Requests 页面发送邀评请求即可启动。",
    action: { label: "发送邀评请求 →", href: "/dashboard/requests" }
  },
  // SMS not going through
  {
    keywords: ["sms not", "not sending", "failed", "short message", "发不出", "发送失败", "短信失败", "why sms", "twilio", "error"],
    reply: "短信发送失败可能的原因：\n1. 短信余额不足 → 前往 Billing 充值\n2. 手机号格式错误 → 确保包含国家区号，如 +1416-555-0123\n3. 客户未填写手机号 → 在 Customers 页面检查\n\n如果余额充足且格式正确，可能是 Twilio 账号限制，联系 support@starloop.app。",
    action: { label: "检查余额 →", href: "/dashboard/billing" }
  },
  // How to check balance and history
  {
    keywords: ["balance", "history", "transaction", "余额", "记录", "how many sms", "剩余", "多少条"],
    reply: "查看余额和充值记录：进入 Billing 页面，顶部显示当前短信余额，页面底部是详细的充值和消耗记录。\n\n余额低于 20 条时会收到邮件提醒。",
    action: { label: "查看余额 →", href: "/dashboard/billing" }
  },
  // Refund policy
  {
    keywords: ["refund", "退款", "return", "cancel", "chargeback", "money back"],
    reply: "关于退款：\n• 未使用的整包退款可在购买后 7 天内申请\n• 已部分使用的套餐按剩余比例退款\n• 联系 support@starloop.app，说明订单情况和原因\n• 我们通常在 2 个工作日内处理\n\n如需帮助，发邮件给我们，附上购买时的邮箱地址。"
  },
  // Send review request
  {
    keywords: ["send", "review request", "first request", "text", "add customer", "发短信", "邀评", "发送"],
    reply: "发送邀评短信：去 Review Requests，点 Add Customer 添加客户姓名和手机号，然后点 Send 即可。客户会立即收到短信，点链接后进入服务补救页面。",
    action: { label: "发送邀评请求 →", href: "/dashboard/requests" }
  },
  // Negative reviews
  {
    keywords: ["negative", "bad review", "unhappy", "complaint", "差评", "低分", "客户不满"],
    reply: "收到低分反馈时：Dashboard 会立即显示通知，您也会收到邮件提醒（含客户联系方式和 AI 建议回复）。\n\n建议 24 小时内联系客户，主动道歉并提供解决方案，大多数客户会因此更新评价。",
    action: { label: "查看反馈收件箱 →", href: "/dashboard/reviews" }
  },
  // Greeting
  {
    keywords: ["hi", "hello", "hey", "help", "你好", "帮助", "who are you"],
    reply: "你好！我是 Maya，StarLoop 的 AI 助手。我可以帮您：\n• 连接 Google Business\n• 充值短信额度\n• 设置服务补救协议\n• 排查短信发送问题\n• 查看余额和记录\n• 退款申请指引\n\n有什么可以帮您的？"
  },
  // Settings
  {
    keywords: ["setting", "profile", "password", "language", "设置", "密码"],
    reply: "所有账户和门店设置都在 Settings 页面：修改门店名称、连接 Google、更改语言偏好等。",
    action: { label: "前往设置 →", href: "/dashboard/settings" }
  },
];

const FALLBACK = "这个问题我需要进一步确认。请发邮件到 support@starloop.app，我们会在几小时内回复。\n\nFeel free to email support@starloop.app — we reply within a few hours.";

function findAnswer(question: string): { reply: string; action?: { label: string; href: string } } {
  const q = question.toLowerCase().trim();
  let bestEntry: KnowledgeEntry | null = null;
  let bestScore = 0;
  for (const entry of KNOWLEDGE) {
    const score = entry.keywords.filter(k => q.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestEntry = entry; }
  }
  if (bestEntry && bestScore > 0) return { reply: bestEntry.reply, action: bestEntry.action };
  return { reply: FALLBACK };
}

interface UserState {
  name: string;
  isNewUser: boolean;
  daysSinceLastLogin: number;
  pendingRequestCount: number;
}

export default function AiAssistant() {
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [mayaEntered, setMayaEntered] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/state")
      .then(r => r.json())
      .then(d => { if (d.name) setUserState(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMayaEntered(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const getGreeting = useCallback((): Message => {
    if (!userState) return { role: "assistant", content: "Hi! I'm Maya, your StarLoop guide. What can I help you with?" };
    const { name, isNewUser, daysSinceLastLogin, pendingRequestCount } = userState;
    if (isNewUser) {
      return { role: "assistant", content: `Hi ${name}, I'm Maya 👋 I'm here to help you get the most out of StarLoop. Want me to walk you through the first steps?` };
    }
    if (daysSinceLastLogin >= 7) {
      return { role: "assistant", content: `Hey ${name}, it's been a while! You have ${pendingRequestCount} customers waiting for a review request. Want me to help you catch up?` };
    }
    return { role: "assistant", content: `Hi again ${name}! What can I help you with today?` };
  }, [userState]);

  const toggleOpen = () => {
    setOpen(o => {
      const next = !o;
      if (next && !initialized) {
        setInitialized(true);
        setMessages([getGreeting()]);
      }
      return next;
    });
  };

  function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const answer = findAnswer(content);
      const isFallback = answer.reply === FALLBACK;
      setMessages([...newMessages, { role: "assistant", content: answer.reply, action: answer.action }]);
      setLoading(false);

      // When falling back to human support, send email confirmation
      if (isFallback && userState) {
        fetch("/api/ai/support-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: content }),
        }).catch(() => {});
      }
    }, 600);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all"
        style={{
          background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
          animation: !mayaEntered ? "mayaBounceIn 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275) both" : undefined,
        }}
        aria-label="Chat with Maya"
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="11" cy="13" r="2" fill="white"/>
            <circle cx="21" cy="13" r="2" fill="white"/>
            <path d="M10 21 Q16 26 22 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "520px", background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
              <circle cx="11" cy="13" r="2" fill="white"/>
              <circle cx="21" cy="13" r="2" fill="white"/>
              <path d="M10 21 Q16 26 22 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            <div>
              <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "0.9375rem" }}>Maya</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>Your StarLoop guide</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0, background: "#FAFAFA" }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.role === "user"
                    ? { background: "#4A6FFF", color: "#FFFFFF", borderBottomRightRadius: "4px" }
                    : { background: "#F5F3FF", color: "#374151", border: "1px solid #EDE9FE", borderBottomLeftRadius: "4px" }
                  }
                >
                  {m.content}
                  {m.action && (
                    <button
                      onClick={() => router.push(`/${locale}${m.action!.href}`)}
                      style={{
                        display: "block", marginTop: "8px",
                        background: "#7C3AED", color: "#FFFFFF",
                        border: "none", borderRadius: "8px",
                        padding: "8px 14px", fontSize: "0.75rem",
                        fontWeight: 500, cursor: "pointer",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      {m.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div style={{ background: "#F5F3FF", border: "1px solid #EDE9FE", borderRadius: "16px", borderBottomLeftRadius: "4px", padding: "10px 14px" }}>
                  <div className="flex gap-1 items-center h-5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: "#A78BFA", animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.filter(m => m.role === "user").length === 0 && (
            <div style={{ padding: "8px 12px 12px", display: "flex", flexWrap: "wrap", gap: "6px", background: "#FAFAFA", borderTop: "1px solid #F0F0F0" }}>
              {[
                "How do I send my first review request?",
                "How do I connect Google Business?",
                "What should I do with a negative review?",
                "How do I read my weekly report?",
                "What does the Recovery inbox do?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    fontSize: "0.71875rem",
                    background: "#F5F3FF",
                    color: "#6D28D9",
                    border: "1px solid #EDE9FE",
                    borderRadius: "16px",
                    padding: "4px 10px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#EDE9FE"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#F5F3FF"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ borderTop: "1px solid #E5E7EB", padding: "12px", display: "flex", gap: "8px", background: "#FFFFFF" }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask me anything about StarLoop..."
              style={{
                flex: 1, fontSize: "0.8125rem",
                padding: "10px 14px",
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                outline: "none",
                color: "#374151",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#7C3AED"; e.target.style.boxShadow = "0 0 0 2px rgba(124,58,237,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                color: "#FFFFFF", border: "none",
                borderRadius: "10px", padding: "10px 14px",
                fontSize: "0.8125rem", fontWeight: 600,
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                opacity: !input.trim() || loading ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
