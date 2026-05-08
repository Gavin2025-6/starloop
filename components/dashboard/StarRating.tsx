interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl" };

export default function StarRating({ rating, max = 5, size = "md" }: StarRatingProps) {
  return (
    <span className={`inline-flex ${sizes[size]}`} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </span>
  );
}
