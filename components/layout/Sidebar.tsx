"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  LayoutDashboard, Star, Send, Users, BarChart2, Settings, LogOut
} from "lucide-react";
import { useSession } from "next-auth/react";

function LogoMark({ height = 24 }: { height?: number }) {
  const sz = Math.round(height * 1.1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(height * 0.3) }}>
      <svg width={sz} height={sz} viewBox="0 0 44 44" fill="none">
        <defs>
          <linearGradient id="sb-star" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C9A7"/><stop offset="100%" stopColor="#4A6FFF"/>
          </linearGradient>
          <linearGradient id="sb-orbit" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.85"/><stop offset="100%" stopColor="#4A6FFF" stopOpacity="0.85"/>
          </linearGradient>
          <marker id="sb-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#4A6FFF" opacity="0.85"/>
          </marker>
        </defs>
        <ellipse cx="22" cy="22" rx="18" ry="9" stroke="url(#sb-orbit)" strokeWidth="2" fill="none"
          strokeDasharray="56 56" strokeDashoffset="28" transform="rotate(-25 22 22)" markerEnd="url(#sb-arrow)"/>
        <path d="M22 4 L24.1 15H35.1L26.4 21.5L29.5 32.5L22 26.1L14.5 32.5L17.6 21.5L8.9 15H19.9Z"
          stroke="url(#sb-star)" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
        <path d="M38 2 L39 5 L42 6 L39 7 L38 10 L37 7 L34 6 L37 5Z" fill="#00C9A7"/>
      </svg>
      <span style={{ fontWeight: 700, fontSize: Math.round(height * 0.7), lineHeight: 1 }}>
        <span style={{ color: "#0D1117" }}>star</span>
        <span style={{ color: "#00C9A7" }}>loop</span>
      </span>
    </div>
  );
}

const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard",           Icon: LayoutDashboard },
  { key: "reviews",   href: "/dashboard/reviews",   Icon: Star },
  { key: "requests",  href: "/dashboard/requests",  Icon: Send },
  { key: "customers", href: "/dashboard/customers", Icon: Users },
  { key: "reports",   href: "/dashboard/reports",   Icon: BarChart2 },
  { key: "settings",  href: "/dashboard/settings",  Icon: Settings },
];

export default function Sidebar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside style={{
      width: "224px",
      minHeight: "100vh",
      background: "#FFFFFF",
      borderRight: "1px solid #E5E7EB",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      fontFamily: "var(--font-geist), -apple-system, sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB" }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <LogoMark height={24} />
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {NAV_ITEMS.map(({ key, href, Icon }) => {
          const fullHref = `/${locale}${href}`;
          const isActive = pathname === fullHref || (href !== "/dashboard" && pathname.startsWith(`${fullHref}/`)) || (href === "/dashboard" && pathname === fullHref);

          return (
            <Link
              key={key}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "0.875rem",
                textDecoration: "none",
                fontWeight: isActive ? 500 : 400,
                background: isActive ? "#F3F4F6" : "transparent",
                color: isActive ? "#0D1117" : "#6B7280",
                transition: "all 0.15s",
              }}
              className={!isActive ? "hover:bg-[#F9FAFB] hover:text-[#0D1117]" : ""}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              {t(key as "dashboard" | "reviews" | "requests" | "customers" | "reports" | "settings")}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div style={{ padding: "12px", borderTop: "1px solid #E5E7EB" }}>
        {session?.user && (
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0D1117", paddingLeft: "12px" }}>
              {session.user.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6B7280", paddingLeft: "12px", marginTop: "1px" }}>
              {session.user.email}
            </div>
          </div>
        )}
        <a
          href="/api/auth/signout"
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "8px",
            fontSize: "0.75rem", color: "#EF4444", textDecoration: "none",
            transition: "all 0.15s",
          }}
          className="hover:bg-[#FEF2F2]"
        >
          <LogOut size={14} />
          {t("logout")}
        </a>
      </div>
    </aside>
  );
}
