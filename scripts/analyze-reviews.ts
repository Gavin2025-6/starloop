/**
 * analyze-reviews.ts
 * Reads PENDING rows from ReviewQueue, calls DeepSeek to classify,
 * updates problemCategory / severity / suggestedAction / analysisStatus.
 *
 * Run: npx tsx scripts/analyze-reviews.ts
 * Options:
 *   --batch  N   rows per run (default 200)
 *   --delay  ms  delay between DeepSeek calls (default 300)
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';

const DATABASE_URL    = process.env.DATABASE_URL ?? '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? '';

if (!DATABASE_URL)     { console.error('❌ DATABASE_URL not set'); process.exit(1); }
if (!DEEPSEEK_API_KEY) { console.error('❌ DEEPSEEK_API_KEY not set'); process.exit(1); }

const db = new Pool({ connectionString: DATABASE_URL, max: 3 });

// ── Parse CLI args ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const batchSize = parseInt(args[args.indexOf('--batch') + 1] ?? '200', 10) || 200;
const delayMs   = parseInt(args[args.indexOf('--delay') + 1] ?? '300', 10) || 300;

// ── DeepSeek call ─────────────────────────────────────────────────────
async function classifyReview(rawText: string, industry: string, city: string): Promise<{
  problemCategory: string;
  severity: string;
  suggestedAction: string;
}> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Classify this negative review for a ${industry} business in ${city}.
Review: "${rawText}"
Respond with JSON only:
{"problemCategory":"WAITING_TIME|PRICE|ATTITUDE|APPOINTMENT|QUALITY|COMMUNICATION|BILLING|CLEANLINESS|PARKING|OTHER","severity":"HIGH|MEDIUM|LOW","suggestedAction":"brief action under 100 chars"}`,
      }],
    }),
  });
  const json = await response.json() as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content ?? '{}';
  const m = text.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : { problemCategory: 'OTHER', severity: 'MEDIUM', suggestedAction: 'Review and respond' };
}

// ── Sleep ─────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  // Count total pending
  const countRes = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM "ReviewQueue" WHERE "analysisStatus" = 'PENDING'`
  );
  const totalPending = parseInt(countRes.rows[0].count, 10);
  console.log(`\n🔍 DeepSeek Review Analyzer`);
  console.log(`   Total PENDING: ${totalPending} | Batch size: ${batchSize} | Delay: ${delayMs}ms\n`);

  if (totalPending === 0) {
    console.log('✅ Nothing to analyze.');
    await db.end();
    return;
  }

  // Fetch batch
  const rows = await db.query<{
    id: string; rawText: string; industry: string; city: string;
  }>(
    `SELECT id, "rawText", industry, city
     FROM "ReviewQueue"
     WHERE "analysisStatus" = 'PENDING'
     ORDER BY "createdAt"
     LIMIT $1`,
    [batchSize]
  );

  console.log(`Processing ${rows.rows.length} reviews...`);

  let done = 0, errors = 0;

  for (const row of rows.rows) {
    try {
      const result = await classifyReview(row.rawText, row.industry, row.city);

      await db.query(
        `UPDATE "ReviewQueue"
         SET "problemCategory"  = $1,
             severity           = $2,
             "suggestedAction"  = $3,
             "analysisStatus"   = 'DONE',
             "updatedAt"        = NOW()
         WHERE id = $4`,
        [result.problemCategory, result.severity, result.suggestedAction, row.id]
      );

      done++;
      if (done % 20 === 0) {
        const remaining = totalPending - done;
        console.log(`  ✓ ${done} done | ${remaining} remaining | ${errors} errors`);
      }
    } catch (err) {
      errors++;
      await db.query(
        `UPDATE "ReviewQueue" SET "analysisStatus" = 'ERROR', "updatedAt" = NOW() WHERE id = $1`,
        [row.id]
      );
      if (errors <= 5) console.error(`  ❌ Error on ${row.id}:`, err instanceof Error ? err.message : err);
    }

    await sleep(delayMs);
  }

  // Final stats
  const finalRes = await db.query<{ status: string; count: string }>(
    `SELECT "analysisStatus" as status, COUNT(*) as count
     FROM "ReviewQueue"
     GROUP BY "analysisStatus"`
  );
  console.log('\n✅ Batch complete!');
  console.log(`   This run: ${done} classified, ${errors} errors`);
  console.log('\n   Database totals:');
  for (const r of finalRes.rows) {
    console.log(`     ${r.status}: ${r.count}`);
  }

  await db.end();
}

main().catch(console.error);
