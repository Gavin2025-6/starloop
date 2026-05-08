import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect("/en/auth/login");
  }

  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
