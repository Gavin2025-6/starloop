"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

const NAV = [
  { href: "/dashboard",              label: "Home",         emoji: "🏠" },
  { href: "/dashboard/front-office", label: "Front Office", emoji: "📞" },
  { href: "/dashboard/jobs",         label: "Jobs",         emoji: "📋" },
  { href: "/dashboard/customers",    label: "Customers",    emoji: "👥" },
  { href: "/dashboard/reviews",      label: "Reviews",      emoji: "⭐" },
  { href: "/dashboard/campaigns",    label: "Campaigns",    emoji: "📢" },
  { href: "/dashboard/settings",     label: "Settings",     emoji: "⚙️" },
];

// Show 5 most important items in the mobile bottom nav
const MOBILE_NAV = NAV.filter(n =>
  ["/dashboard", "/dashboard/jobs", "/dashboard/customers", "/dashboard/reviews", "/dashboard/settings"].includes(n.href)
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1a2744] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const firstName = session.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a2744] flex flex-col fixed h-full z-10 hidden lg:flex">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#f97316] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight">Service Star</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, emoji }) => {
            const active = href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="text-base leading-none">{emoji}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{firstName[0]?.toUpperCase() ?? "U"}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{session.user?.name ?? "My Business"}</p>
              <span className="text-[10px] bg-[#f97316] text-white px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                Free
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-56 min-h-screen pb-16 lg:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        {MOBILE_NAV.map(({ href, label, emoji }) => {
          const active = href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors ${
                active ? "text-[#f97316]" : "text-gray-400"
              }`}
            >
              <span className="text-lg leading-none">{emoji}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
