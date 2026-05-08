import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessId, name, phone, email } = await request.json();

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  if (!business || business.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customer = await prisma.customer.create({
    data: { businessId, name, phone, email },
  });

  return NextResponse.json(customer);
}
