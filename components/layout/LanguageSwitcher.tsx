"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

const LOCALES = [
  { code: "en",    label: "EN" },
  { code: "zh-CN", label: "中文" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    // Store preference
    localStorage.setItem("sl_locale", newLocale);

    // Replace locale segment in path
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            locale === l.code
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
