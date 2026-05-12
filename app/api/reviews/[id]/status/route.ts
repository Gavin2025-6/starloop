import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { taskStatus } = await request.json();

    const valid = ["new", "in_progress", "resolved", "archived"];
    if (!valid.includes(taskStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!review || review.business.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();
    const updated = await prisma.review.update({
      where: { id },
      data: {
        taskStatus,
        resolvedAt: taskStatus === "resolved" ? now : undefined,
        archivedAt: taskStatus === "archived" ? now : undefined,
      },
    });

    return NextResponse.json({ ok: true, taskStatus: updated.taskStatus });
  } catch (err) {
    console.error("[Reviews/Status/PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
