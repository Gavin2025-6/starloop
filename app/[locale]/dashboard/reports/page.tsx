import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import EmptyState from "@/components/ui/EmptyState";

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
      <EmptyState
        type="reports"
        title={t("nav.reports")}
        description="Analytics and reporting coming soon. StarLoop is building detailed reports to help you track review trends, customer satisfaction, and business growth over time."
      />
    </div>
  );
}
