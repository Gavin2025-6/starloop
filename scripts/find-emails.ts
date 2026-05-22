/**
 * find-emails.ts
 * Scrapes business websites to find contact emails and writes them to BusinessProspects.email
 *
 * Run: npx tsx scripts/find-emails.ts
 * Options:
 *   --batch N      max businesses to process this run (default: all)
 *   --timeout ms   per-page fetch timeout (default: 8000)
 *   --delay ms     delay between businesses (default: 500)
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: require('path').join(__dirname, '../.env') });
dotenv.config({ path: require('path').join(__dirname, '../.env.local') });

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? '';
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

const db = new Pool({ connectionString: DATABASE_URL, max: 3 });

// ── CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const batchLimit = parseInt(args[args.indexOf('--batch') + 1] ?? '0') || 0;
const timeoutMs  = parseInt(args[args.indexOf('--timeout') + 1] ?? '8000') || 8000;
const delayMs    = parseInt(args[args.indexOf('--delay') + 1] ?? '500') || 500;

// ── Email regex + filters ─────────────────────────────────────────────
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const INVALID_DOMAINS = [
  'sentry.io', 'sentry-next', 'wixpress.com', 'squarespace.com',
  'shopify.com', 'amazonaws.com', 'cloudfront.net', 'example.com',
  'yourdomain.com', 'domain.com', 'email.com', 'test.com',
];

const INVALID_PREFIXES = [
  'noreply', 'no-reply', 'donotreply', 'bounce', 'mailer-daemon',
  'postmaster', 'webmaster', 'admin@example', 'info@example',
  'test@', 'user@', 'email@',
];

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|pdf|zip)$/i;

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (INVALID_DOMAINS.some(d => lower.includes(d))) return false;
  if (INVALID_PREFIXES.some(p => lower.startsWith(p))) return false;
  if (IMAGE_EXTENSIONS.test(lower)) return false;
  // Must have real TLD
  const parts = lower.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (domain.split('.').pop()!.length < 2) return false;
  return true;
}

// ── Fetch a single URL with timeout ──────────────────────────────────
async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('text') && !ct.includes('html')) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── Extract emails from HTML ──────────────────────────────────────────
function extractEmails(html: string): string[] {
  // Also decode mailto: links
  const decoded = html
    .replace(/&#64;/g, '@')
    .replace(/&#x40;/g, '@')
    .replace(/\[at\]/gi, '@')
    .replace(/\s+at\s+/gi, '@');

  const found = decoded.match(EMAIL_REGEX) ?? [];
  return [...new Set(found.filter(isValidEmail).map(e => e.toLowerCase()))];
}

// ── Build candidate URLs for a business ──────────────────────────────
function buildUrls(rawUrl: string): string[] {
  try {
    let base = rawUrl.trim();
    if (!base.startsWith('http')) base = 'https://' + base;
    const parsed = new URL(base);
    const origin = parsed.origin;
    return [
      origin + '/',
      origin + '/contact',
      origin + '/contact-us',
      origin + '/about',
      origin + '/about-us',
    ];
  } catch {
    return [];
  }
}

// ── Sleep ─────────────────────────────────────────────────────────────
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  // Count total targets
  const countRes = await db.query<{ total: string; remaining: string }>(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE email IS NULL) as remaining
     FROM "BusinessProspects"
     WHERE priority = 'HIGH' AND website IS NOT NULL AND website != ''`
  );
  const { total, remaining } = countRes.rows[0];
  console.log(`\n📧 StarLoop Email Finder`);
  console.log(`   HIGH priority with website: ${total} | Already have email: ${parseInt(total) - parseInt(remaining)} | Remaining: ${remaining}`);
  if (batchLimit) console.log(`   Batch limit: ${batchLimit}`);
  console.log();

  // Fetch businesses without emails (resume support)
  const limit = batchLimit > 0 ? batchLimit : parseInt(remaining);
  const rows = await db.query<{
    id: string; businessName: string; website: string; city: string; industry: string;
  }>(
    `SELECT id, "businessName", website, city, industry
     FROM "BusinessProspects"
     WHERE priority = 'HIGH'
       AND website IS NOT NULL AND website != ''
       AND email IS NULL
     ORDER BY "negativeReviewRate" DESC NULLS LAST
     LIMIT $1`,
    [limit]
  );

  console.log(`Processing ${rows.rows.length} businesses...\n`);

  let found = 0, notFound = 0, errors = 0;

  for (let i = 0; i < rows.rows.length; i++) {
    const biz = rows.rows[i];
    const urls = buildUrls(biz.website);
    if (!urls.length) { errors++; continue; }

    const allEmails: string[] = [];

    for (const url of urls) {
      const html = await fetchText(url);
      if (html) {
        const emails = extractEmails(html);
        allEmails.push(...emails);
      }
    }

    // Dedupe and pick best email (prefer non-gmail, non-yahoo)
    const unique = [...new Set(allEmails)];
    const best = unique.find(e => !e.includes('@gmail') && !e.includes('@yahoo') && !e.includes('@hotmail'))
      ?? unique[0]
      ?? null;

    if (best) {
      await db.query(
        `UPDATE "BusinessProspects" SET email = $1, "updatedAt" = NOW() WHERE id = $2`,
        [best, biz.id]
      );
      found++;
    } else {
      // Mark as searched (empty string = no email found, prevents re-scraping)
      await db.query(
        `UPDATE "BusinessProspects" SET email = '', "updatedAt" = NOW() WHERE id = $1`,
        [biz.id]
      );
      notFound++;
    }

    // Progress every 100
    if ((i + 1) % 100 === 0) {
      const pct = (((i + 1) / rows.rows.length) * 100).toFixed(1);
      console.log(`  [${i + 1}/${rows.rows.length}] ${pct}% | Found: ${found} | Not found: ${notFound} | Errors: ${errors}`);
    }

    await sleep(delayMs);
  }

  // Final stats from DB
  const statsRes = await db.query<{ with_email: string; searched: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') as with_email,
       COUNT(*) FILTER (WHERE email IS NOT NULL) as searched
     FROM "BusinessProspects"
     WHERE priority = 'HIGH' AND website IS NOT NULL AND website != ''`
  );
  const { with_email, searched } = statsRes.rows[0];

  console.log(`\n✅ Done!`);
  console.log(`   This run: found ${found} emails | not found: ${notFound} | errors: ${errors}`);
  console.log(`   DB totals: ${with_email} with email / ${total} HIGH priority businesses (${searched} searched so far)`);

  await db.end();
}

main().catch(e => { console.error(e); process.exit(1); });
