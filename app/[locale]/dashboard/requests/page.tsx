import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import RequestForm from "@/components/dashboard/RequestForm";
import { formatRelativeTime } from "@/lib/utils";

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

  const business = await prisma.business.findFirst({
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

  return (
    <div style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#0D1117" }}>
          {t("requests.title")}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Send SMS or email review requests to your customers</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Send form */}
        <div className="lg:col-span-1">
          <RequestForm
            businessId={business?.id ?? ""}
            customers={business?.customers ?? []}
          />
        </div>

        {/* Request list */}
        <div className="lg:col-span-2">
          {business?.reviewRequests.length ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
                <h2 className="font-semibold text-sm" style={{ color: "#0D1117" }}>Recent Requests</h2>
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
                          {req.customer.name}
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>
                          {req.customer.phone ?? "—"}
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
                No requests sent yet. Add a customer and send your first request!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
