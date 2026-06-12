import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import AuthProvider from "@/components/layout/AuthProvider";
import PostHogInit from "@/components/layout/PostHogInit";
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
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  return (
    <html lang="en" className={geist.variable}>
      <head>
        {clarityId && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`}
          </Script>
        )}
      </head>
      <body className="min-h-screen bg-[#f8fafc] text-gray-900 antialiased font-[family-name:var(--font-geist)]">
        <AuthProvider>
          <PostHogInit />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
