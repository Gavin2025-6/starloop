import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runFollowup } from "@/lib/agents/followup-agent";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { customerId, serviceType, amount } = await req.json();
    if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

    const result = await runFollowup(customerId, serviceType, amount);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[services/complete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
