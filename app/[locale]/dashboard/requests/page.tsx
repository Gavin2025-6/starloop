import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import RequestForm from "@/components/dashboard/RequestForm";
import { formatRelativeTime } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-gray-100 text-gray-600",
  SENT:      "bg-blue-100 text-blue-700",
  DELIVERED: "bg-blue-100 text-blue-700",
  CLICKED:   "bg-yellow-100 text-yellow-700",
  REVIEWED:  "bg-green-100 text-green-700",
  FAILED:    "bg-red-100 text-red-600",
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("requests.title")}
      </h1>

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
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 py-3 text-gray-500 font-medium">
                      {t("customers.name")}
                    </th>
                    <th className="px-4 py-3 text-gray-500 font-medium">
                      {t("requests.status")}
                    </th>
                    <th className="px-4 py-3 text-gray-500 font-medium">
                      {t("requests.sentAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {business.reviewRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {req.customer.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[req.status] ?? STATUS_COLORS.PENDING
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {req.sentAt
                          ? formatRelativeTime(req.sentAt, locale)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-gray-500 text-sm">
                No requests sent yet. Add a customer and send your first request!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
