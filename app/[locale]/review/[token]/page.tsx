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

type Step = "rating" | "feedback" | "done" | "error";
type GateLang = "en" | "zh" | "es" | "fr";

const copy: Record<GateLang, Record<string, string>> = {
  en: {
    loading: "Loading...",
    linkNotFound: "Link not found",
    thankYou: "Thank you!",
    thankYouBody: "Your feedback has been received. We appreciate you taking the time to share your experience with us.",
    experience: "How was your experience?",
    tapStar: "Tap a star to rate",
    shareGoogle: "Continue to Google review",
    improve: "Tell us what we could improve",
    redirecting: "Redirecting...",
    tellUs: "Tell us what we could improve",
    privateHelp: "Your message helps the business respond and make things right.",
    placeholder: "What could have gone better?",
    reachYou: "How can we reach you?",
    optional: "optional",
    phone: "Phone number",
    email: "Email",
    privacy: "Only used by this business to follow up about your experience.",
    submit: "Submit feedback",
    submitting: "Submitting...",
    change: "Change rating",
    publicReview: "I prefer to leave a public Google review",
    powered: "Powered by StarLoop",
  },
  zh: {
    loading: "正在加载...",
    linkNotFound: "链接未找到",
    thankYou: "谢谢你！",
    thankYouBody: "你的反馈已收到。感谢你花时间分享这次体验。",
    experience: "你这次体验怎么样？",
    tapStar: "点击星级评分",
    shareGoogle: "继续去 Google 评价",
    improve: "告诉我们哪里可以改进",
    redirecting: "正在跳转...",
    tellUs: "告诉我们哪里可以改进",
    privateHelp: "你的留言会帮助商家及时跟进和改进服务。",
    placeholder: "哪些地方可以做得更好？",
    reachYou: "商家如何联系你？",
    optional: "选填",
    phone: "电话号码",
    email: "邮箱",
    privacy: "仅用于商家就本次体验与你跟进。",
    submit: "提交反馈",
    submitting: "提交中...",
    change: "修改评分",
    publicReview: "我更想留下公开 Google 评价",
    powered: "Powered by StarLoop",
  },
  es: {
    loading: "Cargando...",
    linkNotFound: "Enlace no encontrado",
    thankYou: "Gracias!",
    thankYouBody: "Recibimos tus comentarios. Gracias por compartir tu experiencia.",
    experience: "Como fue tu experiencia?",
    tapStar: "Toca una estrella para calificar",
    shareGoogle: "Continuar a Google review",
    improve: "Cuéntanos que podemos mejorar",
    redirecting: "Redirigiendo...",
    tellUs: "Cuéntanos que podemos mejorar",
    privateHelp: "Tu mensaje ayuda al negocio a responder y mejorar.",
    placeholder: "Que podria haber sido mejor?",
    reachYou: "Como podemos contactarte?",
    optional: "opcional",
    phone: "Telefono",
    email: "Email",
    privacy: "Solo se usara para dar seguimiento a tu experiencia.",
    submit: "Enviar comentarios",
    submitting: "Enviando...",
    change: "Cambiar calificacion",
    publicReview: "Prefiero dejar una reseña publica en Google",
    powered: "Powered by StarLoop",
  },
  fr: {
    loading: "Chargement...",
    linkNotFound: "Lien introuvable",
    thankYou: "Merci!",
    thankYouBody: "Votre commentaire a ete recu. Merci d'avoir partage votre experience.",
    experience: "Comment etait votre experience?",
    tapStar: "Touchez une etoile pour noter",
    shareGoogle: "Continuer vers Google review",
    improve: "Dites-nous ce que nous pouvons ameliorer",
    redirecting: "Redirection...",
    tellUs: "Dites-nous ce que nous pouvons ameliorer",
    privateHelp: "Votre message aide l'entreprise a repondre et a ameliorer le service.",
    placeholder: "Qu'est-ce qui aurait pu etre mieux?",
    reachYou: "Comment pouvons-nous vous joindre?",
    optional: "facultatif",
    phone: "Telephone",
    email: "Email",
    privacy: "Utilise seulement pour faire un suivi sur votre experience.",
    submit: "Envoyer",
    submitting: "Envoi...",
    change: "Changer la note",
    publicReview: "Je prefere laisser un avis public sur Google",
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

export default function ReviewGatePage() {
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
        if (data.googleUrl) {
          window.location.href = data.googleUrl;
        } else {
          setStep("done");
        }
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

  if (loading) {
    return (
      <div style={bgStyle}>
        <div style={cardStyle}>
          <div className="flex justify-center mb-4">
            <div
              className="w-8 h-8 rounded-full animate-pulse"
              style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)" }}
            />
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div style={bgStyle}>
        <div style={cardStyle}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "#1A1D23" }}>{t.linkNotFound}</h2>
          <p className="text-sm" style={{ color: "#6B7280" }}>{errorMsg}</p>
          <div className="mt-8 text-xs" style={{ color: "#9CA3AF" }}>{t.powered}</div>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div style={bgStyle}>
        <div style={cardStyle}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5" style={{ background: "linear-gradient(135deg, rgba(0,201,167,0.18), rgba(74,111,255,0.18))" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#1A1D23" }}>{t.thankYou}</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
            {t.thankYouBody}
          </p>
          {info?.googleUrl && (
            <a
              href={info.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full py-3 text-sm font-semibold text-white"
              style={{ borderRadius: "12px", background: "#1A1D23" }}
            >
              {t.shareGoogle}
            </a>
          )}
          <div className="mt-8 text-xs" style={{ color: "#9CA3AF" }}>{t.powered}</div>
        </div>
      </div>
    );
  }

  const activeRating = hovered || rating;

  return (
    <div style={bgStyle}>
      <div style={cardStyle}>
        {/* Business header */}
        <div className="mb-7">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #00C9A7, #4A6FFF)" }}
          >
            {info?.businessName?.charAt(0).toUpperCase() ?? "S"}
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#1A1D23" }}>{info?.businessName}</h1>
          {info?.businessCategory && (
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>{info.businessCategory}</p>
          )}
        </div>

        {/* Step: Rating */}
        {step === "rating" && (
          <>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "#1A1D23" }}>
              {t.experience}
            </h2>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>{t.tapStar}</p>

            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= activeRating;
                return (
                  <button
                    key={star}
                    disabled={submitting}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => handleRatingSelect(star)}
                    className="disabled:opacity-50 focus:outline-none transition-transform"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: submitting ? "not-allowed" : "pointer",
                      fontSize: "44px",
                      lineHeight: 1,
                      transform: isActive ? "scale(1.15)" : "scale(1)",
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

            {/* Dynamic CTA hint */}
            {activeRating > 0 && (
              <div
                className="py-2 px-4 rounded-xl text-sm font-medium"
                style={{
                  background: activeRating >= 4
                    ? "rgba(0,201,167,0.1)"
                    : "rgba(255,71,87,0.08)",
                  color: activeRating >= 4 ? "#00C9A7" : "#FF4757",
                  border: `1px solid ${activeRating >= 4 ? "rgba(0,201,167,0.2)" : "rgba(255,71,87,0.15)"}`,
                }}
              >
                {activeRating >= 4 ? t.shareGoogle : t.improve}
              </div>
            )}

            {submitting && (
              <p className="text-xs mt-3" style={{ color: "#6B7280" }}>{t.redirecting}</p>
            )}
          </>
        )}

        {/* Step: Negative feedback form */}
        {step === "feedback" && (
          <>
            <div className="flex justify-center gap-1.5 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{ fontSize: "24px", color: star <= rating ? "#F59E0B" : "#D1D5DB" }}
                >
                  ★
                </span>
              ))}
            </div>

            <h2 className="text-lg font-semibold mb-1" style={{ color: "#1A1D23" }}>
              {t.tellUs}
            </h2>
            <p className="text-xs mb-5" style={{ color: "#6B7280" }}>
              {t.privateHelp}
            </p>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder={t.placeholder}
              className="w-full px-4 py-3 text-sm resize-none mb-4 text-left"
              style={{
                border: "1px solid #E8ECEF",
                borderRadius: "12px",
                outline: "none",
                color: "#1A1D23",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
            />

            <div className="mb-5 text-left space-y-3">
              <p className="text-sm font-medium" style={{ color: "#1A1D23" }}>
                {t.reachYou}{" "}
                <span style={{ color: "#6B7280", fontWeight: 400 }}>({t.optional})</span>
              </p>
              <div>
                <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>{t.phone}</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. 416-555-0123"
                  className="w-full px-4 py-2.5 text-sm"
                  style={{ border: "1px solid #E8ECEF", borderRadius: "10px", outline: "none", color: "#1A1D23" }}
                  onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>{t.email}</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  className="w-full px-4 py-2.5 text-sm"
                  style={{ border: "1px solid #E8ECEF", borderRadius: "10px", outline: "none", color: "#1A1D23" }}
                  onFocus={(e) => { e.target.style.borderColor = "#4A6FFF"; e.target.style.boxShadow = "0 0 0 3px rgba(74,111,255,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E8ECEF"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                {t.privacy}
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs mb-3" style={{ color: "#FF4757" }}>{errorMsg}</p>
            )}

            <button
              onClick={handleFeedbackSubmit}
              disabled={submitting}
              className="w-full py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
                borderRadius: "12px",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? t.submitting : t.submit}
            </button>

            {info?.googleUrl && (
              <a
                href={info.googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-xs"
                style={{ color: "#4A6FFF" }}
              >
                {t.publicReview}
              </a>
            )}

            <button
              onClick={() => { setStep("rating"); setRating(0); }}
              className="mt-3 text-xs"
              style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}
            >
              {t.change}
            </button>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-xs" style={{ color: "#9CA3AF" }}>{t.powered}</div>
      </div>
    </div>
  );
}
