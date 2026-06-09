import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000);

const customers = [
  // Active (30–50 days ago)
  { name: "Michael Chen",    phone: "+14165550101", lastServiceDate: daysAgo(32), totalSpend: 680 },
  { name: "Emily Torres",    phone: "+14165550102", lastServiceDate: daysAgo(45), totalSpend: 420 },
  { name: "James Wilson",    phone: "+14165550103", lastServiceDate: daysAgo(50), totalSpend: 950 },
  // At-risk (70–110 days ago)
  { name: "Sarah Johnson",   phone: "+14165550104", lastServiceDate: daysAgo(72), totalSpend: 1100 },
  { name: "David Park",      phone: "+14165550105", lastServiceDate: daysAgo(85), totalSpend: 560 },
  { name: "Amanda Foster",   phone: "+14165550106", lastServiceDate: daysAgo(95), totalSpend: 780 },
  { name: "Kevin Martinez",  phone: "+14165550107", lastServiceDate: daysAgo(108), totalSpend: 340 },
  // Lost (150–200 days ago)
  { name: "Lisa Thompson",   phone: "+14165550108", lastServiceDate: daysAgo(155), totalSpend: 2100 },
  { name: "Robert Kim",      phone: "+14165550109", lastServiceDate: daysAgo(175), totalSpend: 890 },
  { name: "Nicole Brown",    phone: "+14165550110", lastServiceDate: daysAgo(198), totalSpend: 1450 },
];

async function main() {
  console.log("Seeding test data...");

  // Create user + business
  const passwordHash = await bcrypt.hash("test1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "test@scarborough.com" },
    update: {},
    create: {
      name: "Demo Owner",
      email: "test@scarborough.com",
      passwordHash,
      emailVerified: true,
    },
  });
  console.log("User:", user.email);

  const business = await prisma.business.upsert({
    where: { userId: user.id },
    update: { name: "Scarborough Plumbing", industry: "Plumbing", city: "Toronto", slug: "scarborough-plumbing" },
    create: {
      userId: user.id,
      name: "Scarborough Plumbing",
      industry: "Plumbing",
      phone: "+14165559000",
      email: "info@scarboroughplumbing.ca",
      city: "Toronto",
      address: "1200 Kingston Rd",
      slug: "scarborough-plumbing",
    },
  });
  console.log("Business:", business.name, "slug:", business.slug);

  // Upsert public profile
  await prisma.publicProfile.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      headline: "Toronto's trusted plumber since 2008",
      description: "Fast, reliable plumbing services across Scarborough and East Toronto. Licensed, insured, and available 24/7 for emergencies.",
      services: "Drain cleaning, Water heater repair, Pipe repair, Toilet installation, Emergency plumbing",
      bookingUrl: "https://calendly.com/scarborough-plumbing",
      isPublished: true,
    },
  });

  // Clear existing customers for this business and re-seed
  await prisma.customer.deleteMany({ where: { businessId: business.id } });

  for (const c of customers) {
    await prisma.customer.create({
      data: { businessId: business.id, name: c.name, phone: c.phone, lastServiceDate: c.lastServiceDate, totalSpend: c.totalSpend },
    });
  }
  console.log(`Created ${customers.length} customers`);

  // Run analysis
  const all = await prisma.customer.findMany({ where: { businessId: business.id } });
  let active = 0, atRisk = 0, lost = 0;
  for (const c of all) {
    const days = c.lastServiceDate ? Math.floor((now - c.lastServiceDate.getTime()) / 86400000) : 999;
    const status = days <= 60 ? "active" : days <= 120 ? "at-risk" : "lost";
    await prisma.customer.update({ where: { id: c.id }, data: { status } });
    if (status === "active") active++;
    else if (status === "at-risk") atRisk++;
    else lost++;
  }

  console.log(`Analysis: ${active} active, ${atRisk} at-risk, ${lost} lost`);
  console.log("\nTest login: test@scarborough.com / test1234");
  console.log("Public profile: /b/scarborough-plumbing");
}

main().catch(console.error).finally(() => prisma.$disconnect());
