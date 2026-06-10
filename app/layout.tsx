import type { Metadata } from "next";
import { Geist } from "next/font/google";
import AuthProvider from "@/components/layout/AuthProvider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Service Star — Revenue Recovery for Local Businesses",
  description: "AI-powered revenue system for local service businesses.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Service Star" },
  other: { "mobile-web-app-capable": "yes" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-[#f8fafc] text-gray-900 antialiased font-[family-name:var(--font-geist)]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
