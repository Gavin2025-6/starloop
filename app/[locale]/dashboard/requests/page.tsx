import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import RequestForm from "@/components/dashboard/RequestForm";
import { formatRelativeTime } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: "rgba(107,114,128,0.1)", color: "#6B7280" },
  SENT:      { bg: "rgba(75,142,245,0.1)",  color: "#3B82F6" },
  DELIVERED: { bg: "rgba(75,142,245,0.1)",  color: "#3B82F6" },
  CLICKED:   { bg: "rgba(245,158,11,0.1)",  color: "#D97706" },
  REVIEWED:  { bg: "rgba(0,201,167,0.1)",   color: "#00C9A7" },
  FAILED:    { bg: "rgba(255,71,87,0.1)",   color: "#FF4757" },
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
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>
          {t("requests.title")}
        </h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>Send SMS or email review requests to your customers</p>
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
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="px-5 py-4" style={{ borderBottom: "1px solid #F0F0F5" }}>
                <h2 className="font-semibold text-sm" style={{ color: "#1A1D23" }}>Recent Requests</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0F0F5" }}>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "#6B7280" }}>
                      {t("customers.name")}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "#6B7280" }}>
                      Phone
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "#6B7280" }}>
                      {t("requests.status")}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "#6B7280" }}>
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
                        className="transition-colors hover:bg-gray-50"
                        style={{ borderBottom: "1px solid #F8F9FC" }}
                      >
                        <td className="px-5 py-3 font-medium text-sm" style={{ color: "#1A1D23" }}>
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
              className="bg-white rounded-2xl p-12 text-center"
              style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.1), rgba(75,142,245,0.1))" }}
              >
                📱
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
