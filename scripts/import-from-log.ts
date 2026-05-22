/**
 * import-from-log.ts
 * Reads BUSINESS: lines from /tmp/scrape.log and upserts into BusinessProspects table.
 * Run: npx tsx scripts/import-from-log.ts
 */
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const LOG_FILE = '/tmp/scrape.log';
const connectionString = process.env.DATABASE_URL ?? '';
if (!connectionString) { console.error('DATABASE_URL not set'); process.exit(1); }

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const raw = fs.readFileSync(LOG_FILE, 'utf-8');
  const lines = raw.split('\n').filter(l => l.startsWith('BUSINESS:'));
  console.log(`Found ${lines.length} BUSINESS lines in log`);

  let inserted = 0, skipped = 0, errors = 0;

  for (const line of lines) {
    try {
      const data = JSON.parse(line.slice('BUSINESS:'.length));
      if (!data.googlePlaceId) { skipped++; continue; }

      const negRate = data.negativeReviews && data.totalReviews
        ? data.negativeReviews / data.totalReviews : 0;

      const priority = (data.googleRating != null && data.googleRating <= 3.5) ||
                       negRate > 0.15 ? 'HIGH' : 'MEDIUM';

      await (prisma as any).businessProspects.upsert({
        where: { googlePlaceId: data.googlePlaceId },
        update: {
          googleRating: data.googleRating ?? null,
          totalReviews: data.totalReviews ?? 0,
          negativeReviews: data.negativeReviews ?? 0,
          negativeReviewRate: negRate,
          priority,
          updatedAt: new Date(),
        },
        create: {
          businessName: data.businessName ?? data.name ?? 'Unknown',
          industry: data.industry ?? '',
          industryCategory: data.industryCategory ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          stateProvince: data.stateProvince ?? '',
          country: data.country ?? 'US',
          tier: data.tier ?? 1,
          phone: data.phone ?? null,
          website: data.website ?? null,
          googlePlaceId: data.googlePlaceId,
          googleRating: data.googleRating ?? null,
          totalReviews: data.totalReviews ?? 0,
          negativeReviews: data.negativeReviews ?? 0,
          negativeReviewRate: negRate,
          priority,
          outreachStatus: 'NEW',
        },
      });
      inserted++;
      if (inserted % 50 === 0) process.stdout.write(`  imported ${inserted}...\n`);
    } catch (e: unknown) {
      errors++;
      if (errors <= 3) console.error('Error:', e instanceof Error ? e.message : e);
    }
  }

  console.log(`\n✅ Done: ${inserted} upserted, ${skipped} skipped (no placeId), ${errors} errors`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
