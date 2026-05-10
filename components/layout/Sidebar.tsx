"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";

const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard",            icon: "📊" },
  { key: "reviews",   href: "/dashboard/reviews",    icon: "⭐" },
  { key: "requests",  href: "/dashboard/requests",   icon: "📱" },
  { key: "customers", href: "/dashboard/customers",  icon: "👥" },
  { key: "reports",   href: "/dashboard/reports",    icon: "📈" },
  { key: "settings",  href: "/dashboard/settings",   icon: "⚙️" },
];

export default function Sidebar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <span className="font-bold text-gray-900">StarLoop</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3">
        {NAV_ITEMS.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-1 ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{item.icon}</span>
              {t(item.key as keyof typeof t)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100">
        <a
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <span>🚪</span>
          {t("logout")}
        </a>
      </div>
    </aside>
  );
}
