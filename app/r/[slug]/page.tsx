import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, category: true, address: true },
  });
  if (!business) return { title: "Not Found" };

  const description = `Read real customer reviews for ${business.name}${business.category ? ` — ${business.category}` : ""}${business.address ? ` in ${business.address}` : ""}. Powered by StarLoop.`;

  return {
    title: `${business.name} — Reviews & Info`,
    description,
    openGraph: {
      title: `${business.name} — Reviews & Info`,
      description,
      type: "website",
    },
  };
}

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      category: true,
      address: true,
      phone: true,
      email: true,
      googleReviewUrl: true,
      reviews: {
        where: { rating: 5, source: "GOOGLE" },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: {
          id: true,
          reviewerName: true,
          content: true,
          rating: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!business) notFound();

  // Compute avg rating from all reviews
  const allReviews = await prisma.review.findMany({
    where: { businessId: business.id },
    select: { rating: true },
  });
  const avgRating =
    allReviews.length > 0
      ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
      : null;

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-2xl mx-auto px-6 py-14 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
          {business.category && (
            <p className="text-blue-200 text-sm mb-3">{business.category}</p>
          )}
          {avgRating && (
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-5 py-2 mt-2">
              <span className="text-yellow-300 text-xl">★</span>
              <span className="text-xl font-bold">{avgRating}</span>
              <span className="text-blue-200 text-sm">/ 5 on Google</span>
            </div>
          )}
          {business.address && (
            <p className="text-blue-200 text-xs mt-4">{business.address}</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Contact buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm font-semibold text-gray-800 hover:border-blue-400 hover:text-blue-700 transition-colors shadow-sm"
            >
              📞 {business.phone}
            </a>
          )}
          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm font-semibold text-gray-800 hover:border-blue-400 hover:text-blue-700 transition-colors shadow-sm"
            >
              📧 Email Us
            </a>
          )}
          {business.googleReviewUrl && (
            <a
              href={business.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              ⭐ Leave a Review
            </a>
          )}
        </div>

        {/* 5-star review wall */}
        {business.reviews.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">
              What customers are saying
            </h2>
            <div className="space-y-4">
              {business.reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {r.reviewerName ?? "Anonymous"}
                      </div>
                      <div className="text-yellow-400 text-sm mt-0.5">
                        {stars(r.rating)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(r.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {r.content && (
                    <p className="text-gray-600 text-sm leading-relaxed">
                      &ldquo;{r.content}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {business.reviews.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No reviews yet — be the first!
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-10 py-6 text-center">
        <p className="text-xs text-gray-400">
          {business.name} &middot; Powered by{" "}
          <Link
            href="/"
            className="font-semibold text-blue-600 hover:underline"
          >
            StarLoop
          </Link>
        </p>
      </footer>
    </div>
  );
}
