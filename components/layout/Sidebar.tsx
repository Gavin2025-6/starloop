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
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #E8ECEF" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
          {/* StarLoop icon: star + orbit arc + sparkle */}
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sl-star" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00C9A7"/>
                <stop offset="100%" stopColor="#4A6FFF"/>
              </linearGradient>
              <linearGradient id="sl-orbit" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#4A6FFF" stopOpacity="0.7"/>
              </linearGradient>
            </defs>
            {/* Orbit ellipse arc (behind star) */}
            <ellipse cx="17" cy="17" rx="14" ry="7" stroke="url(#sl-orbit)" strokeWidth="1.5" fill="none"
              strokeDasharray="44 44" strokeDashoffset="22" transform="rotate(-30 17 17)"/>
            {/* Arrowhead on orbit */}
            <path d="M26.5 10.5 L28 13 L25 12.5Z" fill="url(#sl-orbit)"/>
            {/* 5-point star */}
            <path d="M17 5.5 L18.8 11.8H25.4L20.1 15.6L21.9 21.9L17 18.1L12.1 21.9L13.9 15.6L8.6 11.8H15.2Z"
              stroke="url(#sl-star)" strokeWidth="1.4" strokeLinejoin="round"
              fill="none"/>
            {/* Star inner fill (subtle) */}
            <path d="M17 7.8 L18.4 12.5H23.4L19.5 15.2L20.9 19.9L17 17.2L13.1 19.9L14.5 15.2L10.6 12.5H15.6Z"
              fill="url(#sl-star)" fillOpacity="0.15"/>
            {/* Sparkle top-right */}
            <path d="M27 5 L27.6 6.8 L29.4 7.4 L27.6 8 L27 9.8 L26.4 8 L24.6 7.4 L26.4 6.8Z"
              fill="url(#sl-star)"/>
          </svg>

          {/* Wordmark: "star" dark + "loop" gradient */}
          <span className="font-bold text-base tracking-tight" style={{ letterSpacing: "-0.2px" }}>
            <span style={{ color: "#1A1D23" }}>star</span>
            <span style={{
              background: "linear-gradient(135deg, #00C9A7, #4A6FFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>loop</span>
          </span>
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
