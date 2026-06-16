import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingFlow from "./BookingFlow";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { businessSlug } = await params;
  const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
  if (!business) return { title: "Book an Appointment" };
  return { title: `Book with ${business.name}` };
}

export default async function BookPage({ params }: Props) {
  const { businessSlug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    include: {
      priceBookItems: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!business) notFound();

  const initial = business.name.charAt(0).toUpperCase();

  return (
    <BookingFlow
      business={{
        id: business.id,
        name: business.name,
        slug: business.slug,
        phone: business.phone ?? null,
        bookingWeekendEnabled: business.bookingWeekendEnabled,
        cancellationProtectionEnabled: business.cancellationProtectionEnabled ?? false,
        cancellationPolicyText: business.cancellationPolicyText ?? null,
        stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
      }}
      initial={initial}
      priceBookItems={business.priceBookItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? null,
        priceMin: Number(item.priceMin),
        priceMax: Number(item.priceMax),
        unit: item.unit,
      }))}
    />
  );
}
