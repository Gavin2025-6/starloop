"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

// Detects browser/system language on first visit and redirects if needed.
// Priority: 1. localStorage preference  2. navigator.language  3. default (en)
export default function LocaleDetector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run once on mount
    const stored = localStorage.getItem("sl_locale");
    const browserLang = navigator.language || "";

    let preferred: string;
    if (stored) {
      preferred = stored;
    } else if (browserLang.startsWith("zh")) {
      preferred = "zh-CN";
    } else {
      preferred = "en";
    }

    if (preferred !== locale) {
      const segments = pathname.split("/");
      segments[1] = preferred;
      router.replace(segments.join("/"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
