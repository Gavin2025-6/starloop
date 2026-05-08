import ReviewCard from "./ReviewCard";

interface Review {
  id: string;
  reviewerName?: string | null;
  rating: number;
  content?: string | null;
  publishedAt: Date;
  isReplied: boolean;
  isNegative: boolean;
  aiDraftReply?: string | null;
  replyContent?: string | null;
}

interface ReviewListProps {
  reviews: Review[];
  businessId: string;
}

export default function ReviewList({ reviews, businessId }: ReviewListProps) {
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} businessId={businessId} />
      ))}
    </div>
  );
}
