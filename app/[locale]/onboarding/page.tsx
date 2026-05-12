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
            <svg width="64" height="64" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="onb-star" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00C9A7"/>
                  <stop offset="100%" stopColor="#4A6FFF"/>
                </linearGradient>
                <linearGradient id="onb-orbit" x1="34" y1="34" x2="0" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#4A6FFF" stopOpacity="0.8"/>
                </linearGradient>
              </defs>
              <ellipse cx="17" cy="17" rx="14" ry="7" stroke="url(#onb-orbit)" strokeWidth="1.5" fill="none"
                strokeDasharray="44 44" strokeDashoffset="22" transform="rotate(-30 17 17)"/>
              <path d="M26.5 10.5 L28 13 L25 12.5Z" fill="url(#onb-orbit)"/>
              <path d="M17 5.5 L18.8 11.8H25.4L20.1 15.6L21.9 21.9L17 18.1L12.1 21.9L13.9 15.6L8.6 11.8H15.2Z"
                stroke="url(#onb-star)" strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
              <path d="M27 5 L27.6 6.8 L29.4 7.4 L27.6 8 L27 9.8 L26.4 8 L24.6 7.4 L26.4 6.8Z" fill="#00C9A7"/>
            </svg>
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, #00C9A7 0%, #4A6FFF 100%)",
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
                    ? { background: "linear-gradient(135deg, #00C9A7, #4A6FFF)", color: "#fff" }
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
