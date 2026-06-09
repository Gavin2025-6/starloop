import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: { profile: true },
  });

  if (!business) notFound();

  const profile = business.profile;

  // Increment view count (fire-and-forget)
  if (profile) {
    prisma.publicProfile.update({
      where: { businessId: business.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});
  }

  const initial = business.name.charAt(0).toUpperCase();
  const services = profile?.services ? profile.services.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-[family-name:var(--font-geist)]">
      {/* Header */}
      <div className="bg-[#1a2744] px-4 py-6">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="w-16 h-16 bg-[#f97316] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{initial}</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-tight">{business.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="bg-white/20 text-white/90 text-xs px-2.5 py-1 rounded-full">{business.industry}</span>
              {business.city && (
                <span className="text-white/60 text-xs">📍 {business.city}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Headline */}
        {profile?.headline && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-[#1a2744] font-semibold text-base">{profile.headline}</p>
            {profile.description && (
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">{profile.description}</p>
            )}
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Services</h2>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <span key={s} className="bg-[#f8fafc] border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {(profile?.reviewCount ?? 0) > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-[#1a2744]">{profile?.avgRating?.toFixed(1) ?? "—"}</div>
              <div className="text-xs text-gray-400">Avg Rating</div>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-[#1a2744]">{profile?.reviewCount ?? 0}</div>
              <div className="text-xs text-gray-400">Reviews</div>
            </div>
          </div>
        )}

        {/* Book button */}
        {profile?.bookingUrl ? (
          <a
            href={profile.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#f97316] text-white text-center py-4 rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
          >
            Book an Appointment
          </a>
        ) : (
          business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="block w-full bg-[#f97316] text-white text-center py-4 rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
            >
              Call to Book: {business.phone}
            </a>
          )
        )}

        {/* Contact info */}
        {(business.email || business.address) && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2">
            {business.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📍</span> {business.address}{business.city ? `, ${business.city}` : ""}
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>✉️</span>
                <a href={`mailto:${business.email}`} className="hover:underline">{business.email}</a>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📞</span>
                <a href={`tel:${business.phone}`} className="hover:underline">{business.phone}</a>
              </div>
            )}
          </div>
        )}

        {/* PLG footer */}
        <div className="bg-[#1a2744] rounded-2xl p-5 text-center mt-6">
          <p className="text-white/80 text-sm mb-1 font-medium">Want AI to automatically bring back YOUR customers?</p>
          <p className="text-white/50 text-xs mb-4">Just like {business.name} does with Service Star</p>
          <Link
            href={`/auth/register?ref=${slug}`}
            className="block bg-[#f97316] text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
          >
            Start Free with Service Star →
          </Link>
        </div>

      </div>
    </div>
  );
}
