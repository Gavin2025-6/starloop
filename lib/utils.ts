import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string, locale = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale === "zh-CN" ? "zh-CN" : "en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string, locale = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d, locale);
}

export function getGoogleReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return true;
  return new Date() > new Date(trialEndsAt);
}

export function getTrialDaysLeft(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function phoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}
