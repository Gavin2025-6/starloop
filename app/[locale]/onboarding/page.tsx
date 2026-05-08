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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">⭐</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("onboarding.welcome")}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">{t("onboarding.subtitle")}</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step === 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {step}
              </div>
              {step < 3 && <div className="w-12 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        <GoogleConnectStep locale={locale} />
      </div>
    </div>
  );
}
