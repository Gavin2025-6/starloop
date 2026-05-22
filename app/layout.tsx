// Root layout — minimal shell required by Next.js App Router.
// html/body/lang are rendered in app/[locale]/layout.tsx so lang={locale} is correct.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
