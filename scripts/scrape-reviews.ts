import * as dotenv from 'dotenv';
dotenv.config({ path: require('path').join(__dirname, '../.env') });
dotenv.config({ path: require('path').join(__dirname, '../.env.local') });

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import cities from './city-list';
import industries from './industry-list';

// ── Types ────────────────────────────────────────────────────────────
interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
}

interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
}

interface ProgressState {
  completedCombinations: string[];  // "cityName|industryKeyword"
  totalBusinesses: number;
  totalReviewsQueued: number;
  startedAt: string;
  lastUpdatedAt: string;
}

// ── Config ───────────────────────────────────────────────────────────
const GOOGLE_API_KEY        = process.env.GOOGLE_PLACES_API_KEY;
const DATABASE_URL          = process.env.DATABASE_URL;
const PROGRESS_FILE         = path.join(__dirname, '../scrape-progress.json');
const RATE_LIMIT_MS         = 200;
const MAX_PLACES_PER_SEARCH = 20;

// ── Validate env ─────────────────────────────────────────────────────
if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_PLACES_API_KEY is not set. Add it to .env.local');
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Add it to .env.local');
  process.exit(1);
}

// ── DB pool ──────────────────────────────────────────────────────────
const db = new Pool({ connectionString: DATABASE_URL, max: 3 });

// ── Progress helpers ─────────────────────────────────────────────────
function loadProgress(): ProgressState {
  if (fs.existsSync(PROGRESS_FILE)) {
    const saved = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    if ('totalReviewsAnalyzed' in saved && !('totalReviewsQueued' in saved)) {
      saved.totalReviewsQueued = saved.totalReviewsAnalyzed;
    }
    // Migrate old "name|industry" keys → "name|state|country|industry"
    const needsMigration = saved.completedCombinations.some((k: string) => k.split('|').length === 2);
    if (needsMigration) {
      const cityByName = new Map<string, City[]>();
      for (const city of cities) {
        if (!cityByName.has(city.name)) cityByName.set(city.name, []);
        cityByName.get(city.name)!.push(city);
      }
      saved.completedCombinations = saved.completedCombinations.flatMap((k: string) => {
        if (k.split('|').length !== 2) return [k];
        const [cityName, industry] = k.split('|');
        const matches = cityByName.get(cityName) || [];
        if (matches.length === 1) {
          return [`${matches[0].name}|${matches[0].stateProvince}|${matches[0].country}|${industry}`];
        }
        return []; // same name in multiple regions — force re-scrape both
      });
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(saved, null, 2));
    }
    return saved;
  }
  return {
    completedCombinations: [],
    totalBusinesses: 0,
    totalReviewsQueued: 0,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

function saveProgress(state: ProgressState) {
  state.lastUpdatedAt = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2));
}

// ── Rate limiter ──────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Google Places API calls ───────────────────────────────────────────
async function searchPlaces(city: { name: string; stateProvince: string; lat: number; lng: number }, keyword: string): Promise<PlaceResult[]> {
  const query = encodeURIComponent(`${keyword} in ${city.name}, ${city.stateProvince}`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json() as { results: PlaceResult[]; status: string };
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.warn(`  ⚠️ Places API status: ${data.status} for ${keyword} in ${city.name}`);
  }
  return (data.results || []).slice(0, MAX_PLACES_PER_SEARCH);
}

async function getPlaceDetails(placeId: string): Promise<{ phone?: string; website?: string; reviews?: Review[] }> {
  const fields = 'formatted_phone_number,website,reviews';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json() as { result?: { formatted_phone_number?: string; website?: string; reviews?: Review[] }; status: string };
  return data.result || {};
}

// ── DeepSeek classification — DISABLED (handled by analyze-reviews.ts) ─
/*
async function classifyReview(review: string, industry: string, city: string) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 200,
      messages: [{ role: 'user', content: `Classify this negative review for a ${industry} business in ${city}.
Review: "${review}"
Respond with JSON only:
{"problemCategory":"WAITING_TIME|PRICE|ATTITUDE|APPOINTMENT|QUALITY|COMMUNICATION|BILLING|CLEANLINESS|PARKING|OTHER","severity":"HIGH|MEDIUM|LOW","suggestedAction":"brief action under 100 chars"}` }],
    }),
  });
  const json = await response.json() as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content ?? '{}';
  const m = text.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : { problemCategory: 'OTHER', severity: 'MEDIUM', suggestedAction: 'Review and respond' };
}
*/

// ── DB writes ─────────────────────────────────────────────────────────
async function upsertBusinessProspect(data: {
  businessName: string; industry: string; industryCategory: string;
  address: string; city: string; stateProvince: string; country: string; tier: number;
  phone?: string; website?: string; googlePlaceId: string; googleRating?: number;
  totalReviews: number; negativeReviews: number; negativeReviewRate: number; priority: string;
}) {
  await db.query(
    `INSERT INTO "BusinessProspects"
       (id, "businessName", industry, "industryCategory", address, city, "stateProvince",
        country, tier, phone, website, "googlePlaceId", "googleRating", "totalReviews",
        "negativeReviews", "negativeReviewRate", priority, "outreachStatus", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'NEW',NOW(),NOW())
     ON CONFLICT ("googlePlaceId") DO UPDATE SET
       "googleRating"       = EXCLUDED."googleRating",
       "totalReviews"       = EXCLUDED."totalReviews",
       "negativeReviews"    = EXCLUDED."negativeReviews",
       "negativeReviewRate" = EXCLUDED."negativeReviewRate",
       priority             = EXCLUDED.priority,
       "updatedAt"          = NOW()`,
    [data.businessName, data.industry, data.industryCategory, data.address,
     data.city, data.stateProvince, data.country, data.tier,
     data.phone ?? null, data.website ?? null, data.googlePlaceId,
     data.googleRating ?? null, data.totalReviews, data.negativeReviews,
     data.negativeReviewRate, data.priority]
  );
  // also write to stdout log for backup
  process.stdout.write('BUSINESS:' + JSON.stringify(data) + '\n');
}

async function insertReviewQueue(data: {
  googlePlaceId: string; businessName: string; industry: string; industryCategory: string;
  city: string; stateProvince: string; country: string; tier: number;
  rawText: string; authorName?: string; rating: number;
}) {
  await db.query(
    `INSERT INTO "ReviewQueue"
       (id, "googlePlaceId", "businessName", industry, "industryCategory",
        city, "stateProvince", country, tier, "rawText", "authorName", rating,
        "problemCategory", "analysisStatus", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING','PENDING',NOW(),NOW())
     ON CONFLICT DO NOTHING`,
    [data.googlePlaceId, data.businessName, data.industry, data.industryCategory,
     data.city, data.stateProvince, data.country, data.tier,
     data.rawText, data.authorName ?? null, data.rating]
  );
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  const progress = loadProgress();
  const allCities = [...cities].sort((a, b) => a.tier - b.tier);
  const totalCombinations = allCities.length * industries.length;
  let combinationsDone = progress.completedCombinations.length;

  console.log(`\n🚀 StarLoop Review Scraper (no-analysis mode)`);
  console.log(`   Cities: ${allCities.length} | Industries: ${industries.length} | Total combos: ${totalCombinations}`);
  console.log(`   Previously completed: ${combinationsDone} combos, ${progress.totalBusinesses} businesses, ${progress.totalReviewsQueued} reviews queued\n`);

  for (const city of allCities) {
    for (const industry of industries) {
      const comboKey = `${city.name}|${city.stateProvince}|${city.country}|${industry.keyword}`;
      if (progress.completedCombinations.includes(comboKey)) continue;

      process.stderr.write(`\n[Tier${city.tier}] ${city.name}, ${city.stateProvince} × ${industry.keyword} ... `);
      await sleep(RATE_LIMIT_MS);

      try {
        const places = await searchPlaces(city, industry.keyword);
        let businessCount = 0;
        let reviewCount = 0;

        for (const place of places) {
          await sleep(RATE_LIMIT_MS);
          const details = await getPlaceDetails(place.place_id);

          const negativeReviews = (details.reviews || []).filter(r => r.rating <= 3);
          const negativeRate = place.user_ratings_total && place.user_ratings_total > 0
            ? negativeReviews.length / Math.min(details.reviews?.length || 1, place.user_ratings_total)
            : 0;

          const priority = industry.priority === 'HIGH' && negativeRate > 0.1 ? 'HIGH' : 'MEDIUM';

          await upsertBusinessProspect({
            businessName: place.name,
            industry: industry.keyword,
            industryCategory: industry.category,
            address: place.formatted_address,
            city: city.name,
            stateProvince: city.stateProvince,
            country: city.country,
            tier: city.tier,
            phone: details.phone,
            website: details.website,
            googlePlaceId: place.place_id,
            googleRating: place.rating,
            totalReviews: place.user_ratings_total || 0,
            negativeReviews: negativeReviews.length,
            negativeReviewRate: negativeRate,
            priority,
          });
          businessCount++;

          // Queue negative reviews for later analysis — no DeepSeek call here
          for (const review of negativeReviews) {
            if (!review.text || review.text.length < 20) continue;
            await insertReviewQueue({
              googlePlaceId: place.place_id,
              businessName: place.name,
              industry: industry.keyword,
              industryCategory: industry.category,
              city: city.name,
              stateProvince: city.stateProvince,
              country: city.country,
              tier: city.tier,
              rawText: review.text,
              authorName: review.author_name,
              rating: review.rating,
            });
            reviewCount++;
          }
        }

        progress.completedCombinations.push(comboKey);
        progress.totalBusinesses += businessCount;
        progress.totalReviewsQueued += reviewCount;
        combinationsDone++;
        saveProgress(progress);

        process.stderr.write(`✓ ${businessCount} biz, ${reviewCount} reviews queued\n`);
        process.stderr.write(`   Progress: ${combinationsDone}/${totalCombinations} | ${progress.totalBusinesses} biz | ${progress.totalReviewsQueued} pending reviews\n`);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`❌ Error: ${errorMsg}\n`);
      }
    }
  }

  console.error(`\n✅ Scraping complete!`);
  console.error(`   Total businesses: ${progress.totalBusinesses}`);
  console.error(`   Total reviews queued: ${progress.totalReviewsQueued}`);
  await db.end();
}

main().catch(console.error);
