/**
 * build-benchmarks.ts
 * Aggregates analyzed ReviewQueue rows into IndustryBenchmark.
 * Groups by (industry, city, problemCategory), computes count/percentage/sampleSize.
 *
 * Run: npx tsx scripts/build-benchmarks.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';
import { randomUUID } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL ?? '';
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

const db = new Pool({ connectionString: DATABASE_URL, max: 3 });

async function main() {
  console.log('\n🔨 Building IndustryBenchmark from analyzed reviews...\n');

  // Aggregate from ReviewQueue — per (industry+city+problemCategory), dominant severity and suggestedAction
  const { rows } = await db.query<{
    industry: string;
    industryCategory: string;
    city: string;
    stateProvince: string;
    country: string;
    tier: number;
    problemCategory: string;
    severity: string;
    suggestedAction: string;
    count: number;
    sampleSize: number;
    percentage: number;
  }>(`
    WITH base AS (
      SELECT
        industry, "industryCategory", city, "stateProvince", country, tier,
        "problemCategory", severity, "suggestedAction"
      FROM "ReviewQueue"
      WHERE "analysisStatus" = 'DONE'
        AND "problemCategory" IN ('WAITING_TIME','PRICE','ATTITUDE','APPOINTMENT','QUALITY','COMMUNICATION','BILLING','CLEANLINESS','PARKING','OTHER')
        AND severity IN ('HIGH','MEDIUM','LOW')
    ),
    totals AS (
      SELECT industry, city, COUNT(*) AS total
      FROM base
      GROUP BY industry, city
    ),
    grouped AS (
      SELECT
        b.industry,
        b."industryCategory",
        b.city,
        b."stateProvince",
        b.country,
        b.tier,
        b."problemCategory",
        MODE() WITHIN GROUP (ORDER BY b.severity)         AS severity,
        MODE() WITHIN GROUP (ORDER BY b."suggestedAction") AS "suggestedAction",
        COUNT(*)::int                                      AS count,
        t.total::int                                       AS "sampleSize"
      FROM base b
      JOIN totals t ON t.industry = b.industry AND t.city = b.city
      GROUP BY b.industry, b."industryCategory", b.city, b."stateProvince", b.country, b.tier, b."problemCategory", t.total
    )
    SELECT
      industry,
      "industryCategory",
      city,
      "stateProvince",
      country,
      tier,
      "problemCategory",
      severity,
      "suggestedAction",
      count,
      "sampleSize",
      ROUND(count * 100.0 / "sampleSize", 2)::float AS percentage
    FROM grouped
    ORDER BY industry, city, count DESC
  `);

  console.log(`📊 Computed ${rows.length} benchmark entries from ${rows.reduce((sum, r) => Math.max(sum, r.sampleSize), 0)} max-sampleSize reviews`);

  // Clear existing
  const { rowCount: deleted } = await db.query(`DELETE FROM "IndustryBenchmark"`);
  console.log(`🗑️  Cleared ${deleted ?? 0} existing rows`);

  // Batch insert — 13 params per row
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values: unknown[] = [];
    const placeholders = batch.map((row, j) => {
      const b = j * 13;
      values.push(
        randomUUID(),
        row.industry,
        row.industryCategory,
        row.city,
        row.stateProvince,
        row.country,
        row.tier,
        row.problemCategory,
        row.severity,
        row.count,
        row.percentage,
        row.sampleSize,
        row.suggestedAction,
      );
      return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11},$${b+12},$${b+13},NOW(),NOW())`;
    });

    await db.query(`
      INSERT INTO "IndustryBenchmark"
        (id, industry, "industryCategory", city, "stateProvince", country, tier,
         "problemCategory", severity, count, percentage, "sampleSize", "suggestedAction",
         "createdAt", "updatedAt")
      VALUES ${placeholders.join(',')}
    `, values);

    inserted += batch.length;
  }

  console.log(`\n✅ Inserted ${inserted} rows into IndustryBenchmark\n`);

  // Summary breakdown
  const summary = await db.query<{ industry: string; entries: string; totalReviews: string }>(`
    SELECT industry, COUNT(*) AS entries, MAX("sampleSize") AS "totalReviews"
    FROM "IndustryBenchmark"
    GROUP BY industry
    ORDER BY MAX("sampleSize") DESC
    LIMIT 15
  `);
  console.log('📈 Top 15 industries (by review volume):');
  console.log('  Industry                        | Entries | Reviews');
  console.log('  ' + '-'.repeat(55));
  for (const r of summary.rows) {
    console.log(`  ${r.industry.padEnd(32)}| ${String(r.entries).padEnd(8)}| ${r.totalReviews}`);
  }

  const catSummary = await db.query<{ problemCategory: string; total: string }>(`
    SELECT "problemCategory", SUM(count) AS total
    FROM "IndustryBenchmark"
    GROUP BY "problemCategory"
    ORDER BY total DESC
  `);
  console.log('\n📊 Problem category totals across all benchmarks:');
  for (const r of catSummary.rows) {
    console.log(`  ${r.problemCategory.padEnd(20)}: ${r.total}`);
  }

  await db.end();
}

main().catch(console.error);
