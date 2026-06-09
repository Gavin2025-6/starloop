import type { Metadata } from "next";
import { Geist } from "next/font/google";
import AuthProvider from "@/components/layout/AuthProvider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Service Star — Revenue Recovery for Local Businesses",
  description:
    "Automatically win back at-risk customers with AI-personalized SMS campaigns. Track revenue, analyze customer patterns, grow your business.",
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
