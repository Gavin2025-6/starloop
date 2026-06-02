"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface GateInfo {
  businessName: string;
  businessCategory: string | null;
  customerName: string;
  googleUrl: string | null;
  requestId: string;
}

type Step = "rating" | "google-confirm" | "feedback" | "done" | "error";
type GateLang = "en" | "zh" | "es" | "fr";

const copy: Record<GateLang, Record<string, string>> = {
  en: {
    loading: "Loading...",
    linkNotFound: "Link not found",
    caresAbout: "cares deeply about your experience",
    pleaseRate: "Please rate your experience",
    thankYouPositive: "Thank you for the kind words!",
    googlePrompt: "Would you mind sharing your experience on Google? It really helps other customers find us.",
    goGoogle: "Leave a Google Review",
    sorryMessage: "We're sorry to hear things didn't go as expected. Could you tell us what happened?",
    privateHelp: "Your feedback goes directly to the owner — not posted publicly.",
    placeholder: "What could have been better?",
    reachYou: "How can we reach you?",
    optional: "optional",
    phone: "Phone number",
    email: "Email",
    privacy: "Only used by this business to follow up with you directly.",
    googleLink: "If you'd prefer to leave a public Google review instead, click here",
    submit: "Submit Feedback",
    submitting: "Submitting...",
    thankYouTitle: "Thank you for your feedback",
    thankYouBody: "We'll get back to you within 24 hours.",
    change: "Change rating",
    powered: "Powered by StarLoop",
  },
  zh: {
    loading: "加载中...",
    linkNotFound: "链接无效",
    caresAbout: "非常重视您的体验",
    pleaseRate: "请给我们评个分",
    thankYouPositive: "感谢您的认可！",
    googlePrompt: "能去 Google 上留下您的评价吗？这对其他顾客很有帮助。",
    goGoogle: "去 Google 评价",
    sorryMessage: "很抱歉我们的服务没达到您的预期，请告诉我们发生了什么",
    privateHelp: "您的反馈将直接发送给店主，不会公开发布。",
    placeholder: "哪里可以做得更好？",
    reachYou: "我们怎么联系您？",
    optional: "选填",
    phone: "手机号",
    email: "邮箱",
    privacy: "仅由商家用于跟进您的体验，不会用于其他用途。",
    googleLink: "如果您希望直接在 Google 上发布评论，请点击这里",
    submit: "提交反馈",
    submitting: "提交中...",
    thankYouTitle: "感谢您的反馈",
    thankYouBody: "我们会在 24 小时内联系您。",
    change: "重新评分",
    powered: "Powered by StarLoop",
  },
  es: {
    loading: "Cargando...",
    linkNotFound: "Enlace no encontrado",
    caresAbout: "se preocupa profundamente por tu experiencia",
    pleaseRate: "¿Cómo fue tu experiencia?",
    thankYouPositive: "¡Gracias por tus palabras!",
    googlePrompt: "¿Podrías compartir tu experiencia en Google? Ayuda mucho a otros clientes.",
    goGoogle: "Dejar reseña en Google",
    sorryMessage: "Lamentamos que tu experiencia no haya sido la esperada. ¿Puedes contarnos qué pasó?",
    privateHelp: "Tu mensaje va directamente al propietario, no se publica.",
    placeholder: "¿Qué podría haber sido mejor?",
    reachYou: "¿Cómo podemos contactarte?",
    optional: "opcional",
    phone: "Teléfono",
    email: "Email",
    privacy: "Solo se usará para hacerte un seguimiento directo.",
    googleLink: "Si prefieres dejar una reseña pública en Google, haz clic aquí",
    submit: "Enviar comentarios",
    submitting: "Enviando...",
    thankYouTitle: "Gracias por tu opinión",
    thankYouBody: "Te responderemos en 24 horas.",
    change: "Cambiar calificación",
    powered: "Powered by StarLoop",
  },
  fr: {
    loading: "Chargement...",
    linkNotFound: "Lien introuvable",
    caresAbout: "accorde beaucoup d'importance à votre expérience",
    pleaseRate: "Comment s'est passée votre visite ?",
    thankYouPositive: "Merci pour vos bons mots !",
    googlePrompt: "Pourriez-vous partager votre avis sur Google ? Cela aide vraiment les autres clients.",
    goGoogle: "Laisser un avis Google",
    sorryMessage: "Nous sommes désolés que votre expérience n'ait pas été à la hauteur. Pouvez-vous nous dire ce qui s'est passé ?",
    privateHelp: "Votre message va directement au propriétaire — il n'est pas publié.",
    placeholder: "Qu'est-ce qui aurait pu être mieux ?",
    reachYou: "Comment pouvons-nous vous joindre ?",
    optional: "facultatif",
    phone: "Téléphone",
    email: "Email",
    privacy: "Utilisé uniquement pour vous recontacter directement.",
    googleLink: "Si vous préférez laisser un avis public sur Google, cliquez ici",
    submit: "Envoyer",
    submitting: "Envoi...",
    thankYouTitle: "Merci pour vos commentaires",
    thankYouBody: "Nous vous répondrons dans les 24 heures.",
    change: "Changer la note",
    powered: "Powered by StarLoop",
  },
};

function detectGateLang(): GateLang {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("fr")) return "fr";
  return "en";
}

const bgStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #F0F4FF 0%, #E8F5E9 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "24px",
  boxShadow: "0 8px 32px rgba(74,111,255,0.12), 0 2px 8px rgba(0,0,0,0.06)",
  padding: "32px 28px",
  width: "100%",
  maxWidth: "380px",
  textAlign: "center" as const,
};

export default function ServiceRecoveryPage() {
  const params = useParams();
  const token = params.token as string;

  const [info, setInfo] = useState<GateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lang, setLang] = useState<GateLang>("en");
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);

  const t = copy[lang];

  useEffect(() => {
    setLang(detectGateLang());
    fetch(`/api/review-gate?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setStep("error"); setErrorMsg(data.error); }
        else setInfo(data);
      })
      .catch(() => { setStep("error"); setErrorMsg("Something went wrong."); })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleRatingSelect(star: number) {
    setRating(star);

    if (star >= 4) {
      setSubmitting(true);
      try {
        const res = await fetch("/api/review-gate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, rating: star }),
        });
        const data = await res.json();
        setGoogleUrl(data.googleUrl ?? info?.googleUrl ?? null);
        setStep("google-confirm");
      } catch {
        setStep("error");
        setErrorMsg("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else {
      setStep("feedback");
    }
  }

  async function handleFeedbackSubmit() {
    setSubmitting(true);
    try {
      await fetch("/api/review-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          feedback,
          contactPhone: contactPhone.trim() || null,
          contactEmail: contactEmail.trim() || null,
        }),
      });
      setStep("done");
    } catch {
      setErrorMsg("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #E8ECEF",
    borderRadius: "10px",
    outline: "none",
    color: "#1A1D23",
    boxSizing: "border-box" as const,
  };

  if (loading) {
    return (
      <div style={bgStyle}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", animation: "pulse 1.5s infinite" }} />
          </div>
          <p style={{ fontSize: "14px", color: "#6B7280" }}>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div style={bgStyle}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1A1D23", marginBottom: "8px" }}>{t.linkNotFound}</h2>
          <p style={{ fontSize: "14px", color: "#6B7280" }}>{errorMsg}</p>
          <div style={{ marginTop: "32px", fontSize: "12px", color: "#9CA3AF" }}>{t.powered}</div>
        </div>
      </div>
    );
  }

  /* ── 4-5★: Google confirm screen ── */
  if (step === "google-confirm") {
    return (
      <div style={bgStyle}>
        <div style={cardStyle}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px", margin: "0 auto 20px",
          }}>
            ⭐
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1A1D23", marginBottom: "10px" }}>
            {t.thankYouPositive}
          </h2>
          <p style={{ fontSize: "15px", color: "#6B7280", lineHeight: 1.6, marginBottom: "28px" }}>
            {t.googlePrompt}
          </p>

          {googleUrl ? (
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", width: "100%", padding: "15px",
                background: "linear-gradient(135deg, #4A6FFF, #00C9A7)",
                color: "#fff", borderRadius: "14px",
                fontSize: "16px", fontWeight: 700,
                textDecoration: "none", boxSizing: "border-box",
              }}
            >
              {t.goGoogle} →
            </a>
          ) : (
            <div style={{ fontSize: "14px", color: "#6B7280" }}>
              {t.thankYouBody}
            </div>
          )}

          <div style={{ marginTop: "32px", fontSize: "12px", color: "#9CA3AF" }}>{t.powered}</div>
        </div>
      </div>
    );
  }

  /* ── Thank you (after negative feedback submit) ── */
  if (step === "done") {
    return (
      <div style={bgStyle}>
        <div style={cardStyle}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(0,201,167,0.18), rgba(74,111,255,0.18))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", margin: "0 auto 20px",
          }}>
            ✅
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1A1D23", marginBottom: "10px" }}>
            {t.thankYouTitle}
          </h2>
          <p style={{ fontSize: "15px", color: "#6B7280", lineHeight: 1.6 }}>
            {t.thankYouBody}
          </p>
          <div style={{ marginTop: "32px", fontSize: "12px", color: "#9CA3AF" }}>{t.powered}</div>
        </div>
      </div>
    );
  }

  const activeRating = hovered || rating;

  return (
    <div style={bgStyle}>
      <div style={cardStyle}>
        {/* Business header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "18px",
            background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "26px", fontWeight: 700,
            margin: "0 auto 16px",
          }}>
            {info?.businessName?.charAt(0).toUpperCase() ?? "S"}
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1A1D23", marginBottom: "4px" }}>
            {info?.businessName}
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280" }}>
            {t.caresAbout}
          </p>
        </div>

        {/* ── Step: Rating ── */}
        {step === "rating" && (
          <>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#1A1D23", marginBottom: "20px" }}>
              {t.pleaseRate}
            </h2>

            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= activeRating;
                return (
                  <button
                    key={star}
                    disabled={submitting}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => handleRatingSelect(star)}
                    style={{
                      background: "none", border: "none",
                      cursor: submitting ? "not-allowed" : "pointer",
                      fontSize: "46px", lineHeight: 1, padding: "0 2px",
                      transform: isActive ? "scale(1.18)" : "scale(1)",
                      transition: "transform 0.15s ease, color 0.1s ease",
                      color: isActive ? "#F59E0B" : "#D1D5DB",
                    }}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                );
              })}
            </div>

            {submitting && (
              <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "8px" }}>...</p>
            )}
          </>
        )}

        {/* ── Step: Negative feedback ── */}
        {step === "feedback" && (
          <>
            {/* Stars display */}
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "16px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} style={{ fontSize: "24px", color: star <= rating ? "#F59E0B" : "#D1D5DB" }}>★</span>
              ))}
            </div>

            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#1A1D23", marginBottom: "6px" }}>
              {t.sorryMessage}
            </h2>
            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "18px", lineHeight: 1.5 }}>
              {t.privateHelp}
            </p>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder={t.placeholder}
              style={{
                ...inputStyle,
                resize: "none",
                marginBottom: "16px",
                textAlign: "left",
                display: "block",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
            />

            {/* Optional contact */}
            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#1A1D23", marginBottom: "10px" }}>
                {t.reachYou}{" "}
                <span style={{ color: "#6B7280", fontWeight: 400, fontSize: "13px" }}>({t.optional})</span>
              </p>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>{t.phone}</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. 416-555-0123"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>{t.email}</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "6px" }}>{t.privacy}</p>
            </div>

            {errorMsg && (
              <p style={{ fontSize: "12px", color: "#FF4757", marginBottom: "10px" }}>{errorMsg}</p>
            )}

            <button
              onClick={handleFeedbackSubmit}
              disabled={submitting}
              style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
                color: "#fff", borderRadius: "12px",
                border: "none", cursor: submitting ? "not-allowed" : "pointer",
                fontSize: "15px", fontWeight: 600,
                opacity: submitting ? 0.6 : 1,
                marginBottom: "14px",
              }}
            >
              {submitting ? t.submitting : t.submit}
            </button>

            {/* Small gray Google link — compliance requirement */}
            {info?.googleUrl && (
              <a
                href={info.googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "6px" }}
              >
                {t.googleLink}
              </a>
            )}

            <button
              onClick={() => { setStep("rating"); setRating(0); }}
              style={{ fontSize: "12px", color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}
            >
              {t.change}
            </button>
          </>
        )}

        <div style={{ marginTop: "32px", fontSize: "12px", color: "#9CA3AF" }}>{t.powered}</div>
      </div>
    </div>
  );
}
