"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  availableSlots?: string[];
  checkDate?: string;
  bookingComplete?: boolean;
  confirmationId?: string;
}

interface Props {
  businessId: string;
  businessName: string;
  brandColor?: string;
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-3 py-2">
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export default function ChatWidget({ businessId, businessName, brandColor = "#0D1117" }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function start() {
    if (started) return;
    setStarted(true);
    setLoading(true);
    const greeting: Message = {
      role: "assistant",
      content: `Hi! I'm Erin from ${businessName}. What can I help you with today?`,
    };
    setMessages([greeting]);
    setLoading(false);
  }

  function handleOpen() {
    setOpen(true);
    start();
  }

  async function sendMessage(text?: string) {
    const userText = text ?? input.trim();
    if (!userText || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, businessId }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        role: "assistant",
        content: data.text ?? "I'm here to help!",
        availableSlots: data.availableSlots,
        checkDate: data.checkDate,
        bookingComplete: data.bookingComplete,
        confirmationId: data.confirmationId,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
    setLoading(false);
  }

  function handleSlotClick(slot: string, date: string) {
    sendMessage(`I'll take ${slot} on ${date}`);
  }

  const lastMsg = messages[messages.length - 1];
  const bookingDone = lastMsg?.bookingComplete;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div
          className="flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 360, height: 520, border: "1px solid #E5E7EB" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: brandColor }}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  E
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">{businessName}</p>
                <p className="text-white/70 text-xs mt-0.5">● Online</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] space-y-2">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                    }`}
                    style={msg.role === "user" ? { background: brandColor } : {}}
                  >
                    {msg.content}
                  </div>

                  {/* Available slot buttons */}
                  {msg.role === "assistant" && msg.availableSlots && msg.availableSlots.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.availableSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => handleSlotClick(slot, msg.checkDate ?? "")}
                          disabled={loading}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Booking confirmation card */}
                  {msg.role === "assistant" && msg.bookingComplete && msg.confirmationId && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs text-green-800">
                      <p className="font-semibold">Booking confirmed</p>
                      <p className="text-green-600 mt-0.5">Job #{msg.confirmationId}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {!bookingDone && (
            <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message…"
                  disabled={loading}
                  className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400 disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40 shrink-0"
                  style={{ background: brandColor }}
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-2">Powered by ServiceStar</p>
            </div>
          )}

          {bookingDone && (
            <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0 text-center">
              <p className="text-xs text-gray-400">Powered by ServiceStar</p>
            </div>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="flex items-center gap-2 px-4 py-3 rounded-full text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
        style={{ background: brandColor }}
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        {!open && <span>Book Now</span>}
      </button>
    </div>
  );
}
