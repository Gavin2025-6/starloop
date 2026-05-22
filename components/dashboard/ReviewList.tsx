import ReviewCard from "./ReviewCard";

interface Review {
  id: string;
  reviewerName?: string | null;
  rating: number;
  content?: string | null;
  publishedAt: Date | string;
  isReplied: boolean;
  isNegative: boolean;
  aiDraftReply?: string | null;
  replyContent?: string | null;
  source?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

interface ReviewListProps {
  reviews: Review[];
  businessId: string;
}

export default function ReviewList({ reviews, businessId }: ReviewListProps) {
  return (
    <div className="space-y-3">
      {reviews.map((review, index) => (
        <div
          key={review.id}
          style={{
            animation: `pageFadeIn 200ms ease-out ${index * 50}ms both`,
          }}
        >
          <ReviewCard review={review} businessId={businessId} />
        </div>
      ))}
    </div>
  );
}
