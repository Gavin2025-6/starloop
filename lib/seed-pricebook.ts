import { prisma } from "@/lib/prisma";
import { getDefaultServices } from "@/lib/pricebook-defaults";

export async function seedDefaultPriceBook(businessId: string, industry: string): Promise<void> {
  const existing = await prisma.priceBookItem.count({ where: { businessId } });
  if (existing > 0) return; // already has items — don't overwrite

  const services = getDefaultServices(industry);
  if (services.length === 0) return;

  await prisma.priceBookItem.createMany({
    data: services.map((svc, i) => ({
      businessId,
      name: svc.name,
      description: svc.description,
      priceMin: svc.price ?? 0,
      priceMax: svc.price ?? 0,
      unit: "flat",
      isActive: true,
      sortOrder: i,
    })),
  });
}
