import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  const t = await getTranslations();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#0D1117" }}>
        {t("nav.reports")}
      </h1>
      <p className="text-sm" style={{ color: "#6B7280" }}>
        Analytics and reporting coming soon.
      </p>
    </div>
  );
}
