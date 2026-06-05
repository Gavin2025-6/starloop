import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AiAssistant from "@/components/dashboard/AiAssistant";
import PageTransition from "@/components/layout/PageTransition";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // auth() calls the JWT callback which hits the DB and refreshes all flags.
  // This is the server-side source of truth — values here are always fresh.
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  // Belt-and-suspenders: even if middleware is bypassed (e.g., stale cookie),
  // these server-side checks guarantee hard enforcement.
  if (session.user.isEmailVerified === false) {
    redirect(`/${locale}/auth/verify-email`);
  }

  if (session.user.isGoogleConnected === false) {
    redirect(`/${locale}/connect-google`);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-auto p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <AiAssistant />
    </div>
  );
}
