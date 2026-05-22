import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, category: true },
  });
  if (!business) return { title: "Not Found" };
  const description = `Read real customer reviews for ${business.name}${business.category ? ` — ${business.category}` : ""}. Powered by StarLoop.`;
  return {
    title: `${business.name} — Reviews`,
    description,
    openGraph: { title: `${business.name} — Reviews`, description, type: "website" },
  };
}

function StarRating({ rating, size = 20 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width={size} height={size} viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={star <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"}
          />
        </svg>
      ))}
    </div>
  );
}

const AVATAR_COLORS = ["#4A6FFF", "#00C9A7", "#7C3AED", "#F59E0B", "#EF4444"];

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { rating: 5 },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!business) notFound();

  const avgResult = await prisma.review.aggregate({
    where: { businessId: business.id },
    _avg: { rating: true },
  });
  const avgRating = avgResult._avg.rating ? Number(avgResult._avg.rating.toFixed(1)) : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAFAFA",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "48px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{
            fontSize: "2rem", fontWeight: 700, color: "#111827",
            marginBottom: "8px", letterSpacing: "-0.02em",
          }}>
            {business.name}
          </h1>
          {avgRating && (
            <>
              <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                gap: "8px", marginBottom: "8px",
              }}>
                <StarRating rating={avgRating} size={22} />
                <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827" }}>
                  {avgRating}
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>
                Based on {business._count.reviews} Google review{business._count.reviews !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>

        {/* Reviews */}
        {business.reviews.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
            {business.reviews.map((review, i) => (
              <div key={review.id} style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
              }}>
                {/* Avatar circle */}
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFFFFF", fontWeight: 600, fontSize: "1rem",
                  flexShrink: 0,
                }}>
                  {(review.reviewerName || "?")[0].toUpperCase()}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "4px",
                  }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#111827" }}>
                      {review.reviewerName || "Customer"}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#9CA3AF", whiteSpace: "nowrap" }}>
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "long",
                      })}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1px", marginBottom: "8px" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} width="14" height="14" viewBox="0 0 24 24">
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill="#F59E0B"
                        />
                      </svg>
                    ))}
                  </div>
                  <p style={{
                    fontSize: "0.875rem", color: "#4B5563", lineHeight: 1.6,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                  } as React.CSSProperties}>
                    {review.content || "Great experience! Highly recommend this business."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#6B7280" }}>
            <p style={{ fontSize: "1.125rem", marginBottom: "8px" }}>
              No reviews yet — be the first!
            </p>
          </div>
        )}

        {/* CTA Button */}
        {business.googleReviewUrl && (
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <a
              href={business.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#111827",
                color: "#FFFFFF",
                padding: "14px 32px",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                transition: "transform 150ms ease, box-shadow 150ms ease",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Leave us a Google review
            </a>
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9CA3AF", marginTop: "32px" }}>
          Powered by StarLoop
        </p>
      </div>
    </div>
  );
}
