// Root page — next-intl middleware handles locale detection and redirect.
// This file exists only as a fallback.
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/en");
}
