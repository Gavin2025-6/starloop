"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

export default function OnboardingTour() {
  const router = useRouter();
  const locale = useLocale();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/user/state")
      .then((r) => r.json())
      .then((data) => {
        // Only show tour for users who completed onboarding but haven't done the tour
        if (data.isNewUser === true && data.onboardingTourCompleted === false) {
          setReady(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        classes: "shepherd-dark",
        cancelIcon: { enabled: true },
        scrollTo: { behavior: "smooth", block: "center" },
      },
      useModalOverlay: true,
    });

    tour.addStep({
      id: "dashboard",
      title: "Your action center",
      text: "This is your action center — I'll always show you exactly what needs attention today, no guesswork needed.",
      attachTo: { element: "[data-tour='dashboard']", on: "bottom" },
      buttons: [
        { text: "Next →", action: tour.next, classes: "shepherd-button-primary" },
      ],
    });

    tour.addStep({
      id: "reviews",
      title: "Customer signals",
      text: "Every customer signal lives here. I flag recovery tasks automatically so nothing slips through.",
      attachTo: { element: "[data-tour='reviews']", on: "right" },
      buttons: [
        { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next →", action: tour.next, classes: "shepherd-button-primary" },
      ],
    });

    tour.addStep({
      id: "requests",
      title: "Send requests",
      text: "Send feedback requests via SMS or email after every visit. Takes about 10 seconds.",
      attachTo: { element: "[data-tour='requests']", on: "right" },
      buttons: [
        { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next →", action: tour.next, classes: "shepherd-button-primary" },
      ],
    });

    tour.addStep({
      id: "reports",
      title: "Weekly patterns",
      text: "I put together weekly patterns here so you can see what's hurting your rating and what to fix first.",
      attachTo: { element: "[data-tour='reports']", on: "right" },
      buttons: [
        { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next →", action: tour.next, classes: "shepherd-button-primary" },
      ],
    });

    tour.addStep({
      id: "billing",
      title: "Free plan",
      text: "You're on the free plan — upgrade only when StarLoop proves its value to you.",
      attachTo: { element: "[data-tour='billing']", on: "right" },
      buttons: [
        { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next →", action: tour.next, classes: "shepherd-button-primary" },
      ],
    });

    tour.addStep({
      id: "final",
      title: "You're all set!",
      text: "I'm here if you need anything — just click the button in the corner.",
      buttons: [
        {
          text: "Send first request →",
          action: () => {
            tour.complete();
            router.push(`/${locale}/dashboard/requests`);
          },
          classes: "shepherd-button-primary",
        },
      ],
    });

    tour.on("complete", () => {
      fetch("/api/user/tour-complete", { method: "PATCH" }).catch(() => {});
    });

    tour.on("cancel", () => {
      fetch("/api/user/tour-complete", { method: "PATCH" }).catch(() => {});
    });

    tour.start();

    return () => {
      tour.cancel();
    };
  }, [ready, router, locale]);

  return null; // This component doesn't render anything — Shepherd manages its own UI
}
