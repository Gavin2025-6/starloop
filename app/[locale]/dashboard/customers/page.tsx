import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

export default async function CustomersPage({
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
      customers: {
        include: { _count: { select: { reviewRequests: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const customers = business?.customers ?? [];

  // Color palette for avatars
  const avatarGradients = [
    "linear-gradient(135deg, #00C9A7, #4A6FFF)",
    "linear-gradient(135deg, #4A6FFF, #00C9A7)",
    "linear-gradient(135deg, #00C9A7, #10B981)",
    "linear-gradient(135deg, #4A6FFF, #6366F1)",
    "linear-gradient(135deg, #6366F1, #4A6FFF)",
  ];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1D23" }}>
            {t("customers.title")}
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {customers.length} customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {customers.length > 0 ? (
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E8ECEF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #F0F0F5" }}>
                <th className="px-5 py-4 text-left text-xs font-medium" style={{ color: "#6B7280" }}>
                  {t("customers.name")}
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium" style={{ color: "#6B7280" }}>
                  {t("customers.phone")}
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium" style={{ color: "#6B7280" }}>
                  {t("customers.totalRequests")}
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium" style={{ color: "#6B7280" }}>
                  {t("customers.lastContact")}
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, idx) => (
                <tr
                  key={c.id}
                  className="group transition-colors hover:bg-gray-50"
                  style={{
                    borderBottom: "1px solid #F8F9FC",
                    animation: `pageFadeIn 200ms ease-out ${idx * 50}ms both`,
                  }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: avatarGradients[idx % avatarGradients.length] }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: "#1A1D23" }}>{c.name}</div>
                        {c.email && (
                          <div className="text-xs" style={{ color: "#6B7280" }}>{c.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "#6B7280" }}>
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(74,111,255,0.1)", color: "#4A6FFF" }}
                    >
                      {c._count.reviewRequests} sent
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>
                    {formatDate(c.createdAt, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          type="customers"
          title={t("customers.title")}
          description={t("customers.noCustomers")}
        />
      )}
    </div>
  );
}
