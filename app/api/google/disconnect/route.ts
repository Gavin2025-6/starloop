import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        isGoogleConnected: false,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
      },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete("starloop_google_connected");
    return response;
  } catch (err) {
    console.error("[Google/Disconnect]", err);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
