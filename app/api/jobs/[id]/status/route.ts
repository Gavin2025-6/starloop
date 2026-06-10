import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID = ["requested","quoted","confirmed","scheduled","in_progress","completed","invoiced","paid","cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await req.json();
    if (!VALID.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const job = await prisma.job.update({
      where: { id, businessId: business.id },
      data: { status },
    });

    return NextResponse.json(job);
  } catch (err) {
    console.error("[jobs/status]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
