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
  {
    keywords: ["send", "review request", "first request", "sms", "text", "add customer"],
    reply: "Easy! Go to Review Requests in the left menu, click 'Add Customer', enter their name and phone number, then hit Send. They'll get an SMS right away.",
    action: { label: "Go to Review Requests →", href: "/dashboard/requests" }
  },
  {
    keywords: ["connect", "google", "google business", "sync", "gmb"],
    reply: "Head to Settings, scroll to Google Connection, and click Connect. This lets StarLoop watch for new reviews automatically.",
    action: { label: "Go to Settings →", href: "/dashboard/settings" }
  },
  {
    keywords: ["negative", "bad review", "recovery", "unhappy", "complaint", "bad rating"],
    reply: "I'm sorry to hear that — it happens to everyone. Head to your Reviews page and look for the Recovery Tasks tab. I've already flagged it with suggested next steps.",
    action: { label: "Open Recovery Inbox →", href: "/dashboard/reviews" }
  },
  {
    keywords: ["report", "weekly", "rating trend", "pattern", "analytics", "improve"],
    reply: "Your weekly report spotlights rating trends, top complaint themes, and one concrete action to improve. Check Reports in the sidebar every Monday.",
    action: { label: "Go to Reports →", href: "/dashboard/reports" }
  },
  {
    keywords: ["recovery inbox", "recovery", "flag", "follow up", "recovery task"],
    reply: "The Recovery inbox automatically flags unhappy customers so you can reach out before they post a negative review. Find it under Reviews in the sidebar.",
    action: { label: "Go to Reviews →", href: "/dashboard/reviews" }
  },
  {
    keywords: ["price", "plan", "upgrade", "cost", "billing", "free", "starter", "pro"],
    reply: "You're on the free plan right now! You can send review requests and track reviews at no cost. When you're ready for AI-powered replies and advanced reports, check out Billing to upgrade.",
    action: { label: "View Plans →", href: "/dashboard/billing" }
  },
  {
    keywords: ["hi", "hello", "hey", "help", "what can you do", "who are you"],
    reply: "Hi! I'm Maya, your StarLoop guide. I can help you send review requests, connect Google, handle negative reviews, understand your reports, and more. What would you like to know?"
  },
  {
    keywords: ["customer", "add", "import", "upload", "contact"],
    reply: "Go to Customers in the sidebar to see all your contacts. To add a new one, click 'Add Customer' on the Review Requests page — they'll be saved automatically.",
    action: { label: "Go to Customers →", href: "/dashboard/customers" }
  },
  {
    keywords: ["setting", "profile", "business name", "password", "language"],
    reply: "All your account and business settings are in Settings. You can update your profile, change your business name, connect Google, and manage your plan there.",
    action: { label: "Go to Settings →", href: "/dashboard/settings" }
  },
  {
    keywords: ["star", "rating", "review count", "how many"],
    reply: "Your latest rating and review counts are always visible on the Dashboard. For detailed trends, check the Reports page for weekly breakdowns.",
    action: { label: "Go to Dashboard →", href: "/dashboard" }
  }
];

const FALLBACK = "That's a great question — let me connect you with our team. Reach us at support@starloop.app and we'll get back to you within a few hours.";

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
      setMessages([...newMessages, { role: "assistant", content: answer.reply, action: answer.action }]);
      setLoading(false);
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
