"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  LayoutDashboard, Star, Send, Users, BarChart2, Settings, LogOut, CreditCard,
  TrendingUp, Globe, Share2,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Logo from "@/components/ui/Logo";

const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard",           Icon: LayoutDashboard, label: null },
  { key: "reviews",   href: "/dashboard/reviews",   Icon: Star,           label: null },
  { key: "requests",  href: "/dashboard/requests",  Icon: Send,           label: null },
  { key: "customers", href: "/dashboard/customers", Icon: Users,          label: null },
  { key: "roi",       href: "/dashboard/roi",       Icon: TrendingUp,     label: "ROI" },
  { key: "platforms", href: "/dashboard/reviews/platforms", Icon: Globe,  label: "Platforms" },
  { key: "geo",       href: "/dashboard/geo",       Icon: Share2,         label: "AI Search" },
  { key: "reports",   href: "/dashboard/reports",   Icon: BarChart2,      label: null },
  { key: "billing",   href: "/dashboard/billing",   Icon: CreditCard,     label: null },
  { key: "settings",  href: "/dashboard/settings",  Icon: Settings,       label: null },
];

type NavKey = "dashboard" | "reviews" | "requests" | "customers" | "reports" | "billing" | "settings";

export default function Sidebar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const TRANSLATED_KEYS: NavKey[] = ["dashboard", "reviews", "requests", "customers", "reports", "billing", "settings"];

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
          <Logo height={24} />
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
        {NAV_ITEMS.map(({ key, href, Icon, label }) => {
          const fullHref = `/${locale}${href}`;
          const isActive = pathname === fullHref || (href !== "/dashboard" && pathname.startsWith(`${fullHref}`)) || (href === "/dashboard" && pathname === fullHref);
          const displayLabel = label ?? (TRANSLATED_KEYS.includes(key as NavKey) ? t(key as NavKey) : key);

          return (
            <Link
              key={key}
              href={href}
              data-tour={key}
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
              {displayLabel}
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
        <button
          type="button"
          onClick={async () => {
            await signOut({ redirect: false });
            router.replace(`/${locale}/auth/login`);
            router.refresh();
          }}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "8px",
            fontSize: "0.75rem", color: "#EF4444", textDecoration: "none",
            transition: "all 0.15s",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            width: "100%",
          }}
          className="hover:bg-[#FEF2F2]"
        >
          <LogOut size={14} />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
