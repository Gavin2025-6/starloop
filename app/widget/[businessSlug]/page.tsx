import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChatWidget from "@/components/widget/ChatWidget";

export const dynamic = "force-dynamic";

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!business) notFound();

  return (
    <div
      className="w-full h-screen bg-transparent flex items-end justify-end"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <ChatWidget
        businessId={business.id}
        businessName={business.name}
        brandColor="#0D1117"
      />
    </div>
  );
}
