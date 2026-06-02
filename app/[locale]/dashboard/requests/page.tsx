import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import RequestForm from "@/components/dashboard/RequestForm";
import { formatRelativeTime } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  REVIEWED:  { bg: "#F0FDF4", color: "#10B981" },
  SENT:      { bg: "#EFF6FF", color: "#3B82F6" },
  DELIVERED: { bg: "#EFF6FF", color: "#3B82F6" },
  CLICKED:   { bg: "#FFFBEB", color: "#D97706" },
  PENDING:   { bg: "#FFF7ED", color: "#F59E0B" },
  FAILED:    { bg: "#FEF2F2", color: "#EF4444" },
};

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations();

  let business = null;

  try {
    business = await prisma.business.findFirst({
      where: { userId: session.user.id },
      include: {
        reviewRequests: {
          include: { customer: true },
          orderBy: { sentAt: "desc" },
          take: 50,
        },
        customers: { orderBy: { createdAt: "desc" } },
      },
    });
  } catch (error) {
    console.error("Failed to load review requests page", error);

    return (
      <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
        <div className="max-w-xl rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold" style={{ color: "#0D1117" }}>
            Feedback requests could not load
          </h1>
          <p className="mt-3 text-sm leading-6" style={{ color: "#6B7280" }}>
            StarLoop could not load request data right now. Your account is still safe; reload the page or return to the dashboard.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-3 text-sm font-semibold"
              style={{ background: "#0D1117", color: "#FFFFFF", textDecoration: "none" }}
            >
              Back to dashboard
            </Link>
            <Link
              href="/dashboard/requests"
              className="rounded-lg px-4 py-3 text-sm font-semibold"
              style={{ border: "1px solid #DDE5EF", color: "#0D1117", textDecoration: "none" }}
            >
              Reload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#0D1117" }}>
          Feedback requests
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          Ask recent customers for feedback, follow up with unhappy customers quickly, and let happy customers share their experience.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Send form */}
        <div className="lg:col-span-1">
          {business ? (
            <RequestForm
              businessId={business.id}
              customers={business.customers}
            />
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
              <h2 className="font-semibold mb-1" style={{ color: "#0D1117" }}>
                Set up your business first
              </h2>
              <p className="text-sm leading-6 mb-5" style={{ color: "#6B7280" }}>
                Create a business profile before sending feedback requests.
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-flex rounded-lg px-4 py-3 text-sm font-semibold"
                style={{ background: "#0D1117", color: "#FFFFFF", textDecoration: "none" }}
              >
                Open settings
              </Link>
            </div>
          )}
        </div>

        {/* Request list */}
        <div className="lg:col-span-2">
          {business?.reviewRequests.length ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
                <h2 className="font-semibold text-sm" style={{ color: "#0D1117" }}>Recent feedback requests</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#6B7280" }}>
                      {t("customers.name")}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#6B7280" }}>
                      Phone
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#6B7280" }}>
                      {t("requests.status")}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#6B7280" }}>
                      {t("requests.sentAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {business.reviewRequests.map((req) => {
                    const style = STATUS_STYLES[req.status] ?? STATUS_STYLES.PENDING;
                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-[#F9FAFB] transition-colors"
                        style={{ borderBottom: "1px solid #E5E7EB" }}
                      >
                        <td className="px-5 py-3 font-medium text-sm" style={{ color: "#0D1117" }}>
                          {req.customer?.name ?? "Unknown customer"}
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>
                          {req.customer?.phone ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: style.bg, color: style.color }}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>
                          {req.sentAt ? formatRelativeTime(req.sentAt, locale) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="bg-white rounded-xl p-12 text-center"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <div
                className="w-12 h-12 bg-[#F3F4F6] rounded-xl flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-2xl">📱</span>
              </div>
              <p className="text-sm max-w-xs mx-auto" style={{ color: "#6B7280" }}>
                No feedback requests sent yet. Add a customer and start the loop.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
