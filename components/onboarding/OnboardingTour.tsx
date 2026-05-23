"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

interface Review {
  id: string;
  rating: number;
  reviewerName: string;
  content: string;
}

const mockReviews: Review[] = [
  {
    id: "mock-1",
    rating: 2,
    reviewerName: "Sarah M.",
    content: "Wait time was too long, staff seemed overwhelmed.",
  },
  {
    id: "mock-2",
    rating: 5,
    reviewerName: "John D.",
    content: "Amazing service! Will definitely come back.",
  },
  {
    id: "mock-3",
    rating: 3,
    reviewerName: "Mike T.",
    content: "Good food but parking needs improvement.",
  },
];

function normalizeReviews(data: unknown): Review[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { reviews?: unknown })?.reviews)
      ? (data as { reviews: unknown[] }).reviews
      : [];

  return list
    .map((item) => {
      const review = item as Partial<Review>;
      return {
        id: String(review.id ?? crypto.randomUUID()),
        rating: Number(review.rating ?? 0),
        reviewerName: String(review.reviewerName ?? "Customer"),
        content: String(review.content ?? ""),
      };
    })
    .filter((review) => review.content.trim().length > 0);
}

export default function OnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shouldStart, setShouldStart] = useState(false);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const tourStartedRef = useRef(false);

  const removeTourParam = useCallback(() => {
    if (searchParams.get("tour") !== "true") return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("tour");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function prepareTour() {
      const hasTourParam = searchParams.get("tour") === "true";
      let shouldOpenTour = hasTourParam;

      if (!shouldOpenTour) {
        try {
          const stateResponse = await fetch("/api/user/state");
          if (stateResponse.ok) {
            const state = await stateResponse.json();
            shouldOpenTour = state?.onboardingTourCompleted === false;
          }
        } catch {
          shouldOpenTour = false;
        }
      }

      if (!shouldOpenTour) return;

      try {
        const reviewResponse = await fetch("/api/reviews?limit=10");
        const data = reviewResponse.ok ? await reviewResponse.json() : null;
        const fetchedReviews = normalizeReviews(data);
        if (!cancelled) {
          setReviews(fetchedReviews.length > 0 ? fetchedReviews : mockReviews);
          setShouldStart(true);
        }
      } catch {
        if (!cancelled) {
          setReviews(mockReviews);
          setShouldStart(true);
        }
      }
    }

    prepareTour();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!shouldStart || !reviews || tourStartedRef.current) return;

    const negativeReview = reviews.find((review) => review.rating <= 3) ?? mockReviews[0];
    const positiveReview = reviews.find((review) => review.rating >= 4) ?? mockReviews[1];

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: "starloop-onboarding-tour",
        scrollTo: { behavior: "smooth", block: "center" },
      },
      useModalOverlay: true,
    });

    const backButton = {
      text: "Back",
      action: () => tour.back(),
      classes: "shepherd-button-secondary",
    };
    const nextButton = {
      text: "Next",
      action: () => tour.next(),
      classes: "shepherd-button-primary",
    };

    tour.addStep({
      id: "dashboard-overview",
      title: "Your reputation at a glance",
      text: "This is your daily command center. StarLoop shows you exactly what needs attention today.",
      attachTo: { element: ".dashboard-overview", on: "bottom" },
      buttons: [nextButton],
    });

    tour.addStep({
      id: "reviews-list",
      title: "Catch problems before they go public",
      text: `Every unhappy customer is flagged here. Maya has analyzed what went wrong and drafted a recovery message.\n\nExample: "${negativeReview.content}" - ${negativeReview.reviewerName}`,
      attachTo: { element: ".reviews-list", on: "top" },
      buttons: [backButton, nextButton],
    });

    tour.addStep({
      id: "ai-reply-section",
      title: "Reply in seconds, not minutes",
      text: "Maya drafts the perfect response. You approve with one click, or edit before sending.",
      attachTo: { element: ".ai-reply-section", on: "top" },
      buttons: [backButton, nextButton],
    });

    tour.addStep({
      id: "positive-reviews-section",
      title: "Turn 5-star reviews into new customers",
      text: `One click publishes great reviews to your public page and social channels.\n\nExample: "${positiveReview.content}" - ${positiveReview.reviewerName}`,
      attachTo: { element: ".positive-reviews-section", on: "top" },
      buttons: [backButton, nextButton],
    });

    tour.addStep({
      id: "weekly-report-section",
      title: "Know what to fix every Monday",
      text: "StarLoop sends a weekly report showing what hurt your rating and what recovered it.",
      attachTo: { element: ".weekly-report-section", on: "top" },
      buttons: [backButton, nextButton],
    });

    tour.addStep({
      id: "review-request-section",
      title: "Ask at the perfect moment",
      text: "Set it once. StarLoop automatically asks happy customers for a review right after their visit.",
      attachTo: { element: ".review-request-section", on: "top" },
      buttons: [
        {
          text: "Done",
          action: () => tour.complete(),
          classes: "shepherd-button-primary",
        },
      ],
    });

    tour.on("complete", () => {
      fetch("/api/user/onboarding-complete", { method: "PATCH" }).catch(() => {});
      removeTourParam();
    });

    tour.on("cancel", () => {
      removeTourParam();
    });

    tourStartedRef.current = true;
    tour.start();

    return () => {
      if (tour.isActive()) {
        tour.cancel();
      }
    };
  }, [removeTourParam, reviews, shouldStart]);

  return null;
}
