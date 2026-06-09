import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { userId: session.user.id } });
    if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

    const { csv } = await req.json();
    const lines = (csv as string).trim().split("\n");
    const header = lines[0].toLowerCase().split(",").map((h: string) => h.trim());

    const idx = {
      name: header.indexOf("name"),
      phone: header.indexOf("phone"),
      email: header.indexOf("email"),
      lastServiceDate: header.indexOf("lastservicedate"),
      totalSpend: header.indexOf("totalspend"),
    };

    const rows = lines.slice(1).map((line: string) => {
      const cols = line.split(",").map((c: string) => c.trim());
      return {
        businessId: business.id,
        name: cols[idx.name] || "Unknown",
        phone: idx.phone >= 0 ? cols[idx.phone] || null : null,
        email: idx.email >= 0 ? cols[idx.email] || null : null,
        lastServiceDate:
          idx.lastServiceDate >= 0 && cols[idx.lastServiceDate]
            ? new Date(cols[idx.lastServiceDate])
            : null,
        totalSpend:
          idx.totalSpend >= 0 ? parseFloat(cols[idx.totalSpend]) || 0 : 0,
      };
    });

    const result = await prisma.customer.createMany({ data: rows, skipDuplicates: true });
    return NextResponse.json({ imported: result.count });
  } catch (err) {
    console.error("[customers/import]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
