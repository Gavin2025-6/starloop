"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

interface Review {
  id: string;
  rating: number;
  reviewerName: string;
  content: string;
}

const MOCK_REVIEWS: Review[] = [
  { id: "mock-1", rating: 2, reviewerName: "Sarah M.", content: "Wait time was too long, staff seemed overwhelmed." },
  { id: "mock-2", rating: 5, reviewerName: "John D.", content: "Amazing service! Will definitely come back." },
  { id: "mock-3", rating: 3, reviewerName: "Mike T.", content: "Good food but parking needs improvement." },
];

export default function OnboardingTour() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Fetch real reviews, fall back to mock data if empty
    fetch("/api/reviews?limit=10")
      .then((r) => r.json())
      .then((data) => {
        const list = data?.reviews ?? data ?? [];
        setReviews(list.length > 0 ? list : MOCK_REVIEWS);
      })
      .catch(() => setReviews(MOCK_REVIEWS));

    // Start tour from query param or first-time user
    if (searchParams.get("tour") === "true") {
      setReady(true);
    } else {
      fetch("/api/user/state")
        .then((r) => r.json())
        .then((data) => {
          if (data.onboardingTourCompleted === false) {
            setReady(true);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    if (!ready) return;

    // Build a preview snippet from reviews for the tour
    const negativeReview = reviews.find((r) => r.rating <= 2);
    const positiveReview = reviews.find((r) => r.rating >= 5);
    const negativePreview = negativeReview
      ? `"${negativeReview.content.slice(0, 60)}..." — ${negativeReview.reviewerName}`
      : "Wait time was too long... — Sarah M.";
    const positivePreview = positiveReview
      ? `"${positiveReview.content.slice(0, 60)}..." — ${positiveReview.reviewerName}`
      : "Amazing service! — John D.";

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        classes: "shepherd-dark",
        cancelIcon: { enabled: true },
        scrollTo: { behavior: "smooth", block: "center" },
      },
      useModalOverlay: true,
    });

    tour.addStep({
      id: "dashboard-overview",
      title: "Your reputation at a glance",
      text: "This is your daily command center. StarLoop shows you exactly what needs attention today.",
      attachTo: { element: ".dashboard-overview", on: "bottom" },
      buttons: [{ text: "Next →", action: tour.next, classes: "shepherd-button-primary" }],
    });

    tour.addStep({
      id: "reviews-list",
      title: "Catch problems before they go public",
      text: `Every unhappy customer is flagged here. Maya has analyzed what went wrong and drafted a recovery message.\n\n${negativePreview}`,
      attachTo: { element: ".reviews-list", on: "top" },
      buttons: [
        { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next →", action: tour.next, classes: "shepherd-button-primary" },
      ],
    });

    tour.addStep({
      id: "ai-reply",
      title: "Reply in seconds, not minutes",
      text: "Maya drafts the perfect response. You approve with one click — or edit before sending.",
      attachTo: { element: ".ai-reply-section", on: "top" },
      buttons: [
        { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next →", action: tour.next, classes: "shepherd-button-primary" },
      ],
    });

    tour.addStep({
      id: "positive-reviews",
      title: "Turn 5-star reviews into new customers",
      text: `One click publishes great reviews to your public page and social channels.\n\n${positivePreview}`,
      attachTo: { element: ".positive-reviews-section", on: "top" },
      buttons: [
        { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next →", action: tour.next, classes: "shepherd-button-primary" },
      ],
    });

    tour.addStep({
      id: "weekly-report",
      title: "Know what to fix every Monday",
      text: "StarLoop sends a weekly report showing what hurt your rating and what recovered it.",
      attachTo: { element: ".weekly-report-section", on: "top" },
      buttons: [
        { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next →", action: tour.next, classes: "shepherd-button-primary" },
      ],
    });

    tour.addStep({
      id: "review-request",
      title: "Ask at the perfect moment",
      text: "Set it once. StarLoop automatically asks happy customers for a review right after their visit.",
      attachTo: { element: ".review-request-section", on: "top" },
      buttons: [{ text: "Done", action: tour.complete, classes: "shepherd-button-primary" }],
    });

    tour.on("complete", () => {
      fetch("/api/user/tour-complete", { method: "PATCH" }).catch(() => {});
      if (searchParams.get("tour") === "true") {
        router.replace(`/${locale}/dashboard`);
      }
    });

    tour.on("cancel", () => {
      fetch("/api/user/tour-complete", { method: "PATCH" }).catch(() => {});
      if (searchParams.get("tour") === "true") {
        router.replace(`/${locale}/dashboard`);
      }
    });

    tour.start();

    return () => { tour.cancel(); };
  }, [ready, reviews, router, locale, searchParams]);

  return null;
}
