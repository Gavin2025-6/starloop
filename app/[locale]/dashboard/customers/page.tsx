import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("customers.title")}
        </h1>
      </div>

      {customers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-gray-500 font-medium">
                  {t("customers.name")}
                </th>
                <th className="px-4 py-3 text-gray-500 font-medium">
                  {t("customers.phone")}
                </th>
                <th className="px-4 py-3 text-gray-500 font-medium">
                  {t("customers.totalRequests")}
                </th>
                <th className="px-4 py-3 text-gray-500 font-medium">
                  {t("customers.lastContact")}
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c._count.reviewRequests}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(c.createdAt, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-gray-500 text-sm">{t("customers.noCustomers")}</p>
        </div>
      )}
    </div>
  );
}
