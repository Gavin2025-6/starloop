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
    <aside
      className="w-56 flex flex-col"
      style={{
        background: "#FFFFFF",
        borderRight: "1px solid #E8ECEF",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: "1px solid #E8ECEF" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="url(#sidebarGrad)" strokeWidth="2" fill="none"/>
            <path d="M16 8 L17.5 13H22.5L18.5 16L20 21L16 18L12 21L13.5 16L9.5 13H14.5Z" fill="url(#sidebarGrad)"/>
            <defs><linearGradient id="sidebarGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#4B8EF5"/></linearGradient></defs>
          </svg>
          <span className="font-bold text-base" style={{ color: "#1A1D23" }}>StarLoop</span>
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 no-underline"
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, #6C63FF 0%, #4B8EF5 100%)",
                      color: "#ffffff",
                    }
                  : {
                      color: "#6B7280",
                      background: "transparent",
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(108,99,255,0.08)";
                  e.currentTarget.style.color = "#6C63FF";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6B7280";
                }
              }}
            >
              <span>{item.icon}</span>
              {t(item.key as keyof typeof t)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3" style={{ borderTop: "1px solid #E8ECEF" }}>
        <a
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm no-underline transition-all"
          style={{ color: "#6B7280" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F8F9FC"; e.currentTarget.style.color = "#FF4757"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280"; }}
        >
          <span>🚪</span>
          {t("logout")}
        </a>
      </div>
    </aside>
  );
}
