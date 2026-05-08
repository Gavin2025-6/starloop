import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishReply } from "@/lib/google";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { replyContent } = await request.json();

  const review = await prisma.review.findUnique({
    where: { id },
    include: { business: true },
  });

  if (!review || review.business.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Try to publish to Google if connected
  let published = false;
  if (
    review.business.isGoogleConnected &&
    review.business.googleAccessToken &&
    review.externalId
  ) {
    try {
      published = await publishReply(
        review.business.googleAccessToken,
        review.externalId,
        replyContent
      );
    } catch (err) {
      console.error("[Reply/Google]", err);
    }
  }

  await prisma.review.update({
    where: { id },
    data: {
      replyContent,
      isReplied: true,
      replyPublishedAt: published ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, published });
}
