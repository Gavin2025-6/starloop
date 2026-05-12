import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import GoogleConnectStep from "@/components/onboarding/GoogleConnectStep";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "#F8F9FC",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" stroke="url(#onbGrad)" strokeWidth="2" fill="none"/>
              <path d="M16 8 L17.5 13H22.5L18.5 16L20 21L16 18L12 21L13.5 16L9.5 13H14.5Z" fill="url(#onbGrad)"/>
              <defs><linearGradient id="onbGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#4B8EF5"/></linearGradient></defs>
            </svg>
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, #6C63FF 0%, #4B8EF5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("onboarding.welcome")}
          </h1>
          {session.user.name && (
            <p className="text-base" style={{ color: "#6B7280" }}>
              {t("onboarding.subtitle")}
            </p>
          )}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                style={
                  step === 1
                    ? { background: "linear-gradient(135deg, #6C63FF, #4B8EF5)", color: "#fff" }
                    : { background: "#E8ECEF", color: "#6B7280" }
                }
              >
                {step}
              </div>
              {step < 3 && (
                <div className="w-12 h-0.5" style={{ background: "#E8ECEF" }} />
              )}
            </div>
          ))}
        </div>

        {/* Feature preview cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "📊", title: "Track Rating", desc: "Monitor your Google score" },
            { icon: "🤖", title: "AI Replies", desc: "Reply in 30 seconds" },
            { icon: "🛡️", title: "Review Gate", desc: "Keep bad reviews private" },
          ].map((feat) => (
            <div
              key={feat.title}
              className="bg-white rounded-2xl p-4 text-center"
              style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="text-2xl mb-2">{feat.icon}</div>
              <div className="text-xs font-semibold mb-1" style={{ color: "#1A1D23" }}>{feat.title}</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>{feat.desc}</div>
            </div>
          ))}
        </div>

        <GoogleConnectStep locale={locale} />
      </div>
    </div>
  );
}
