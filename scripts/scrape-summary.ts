import * as fs from 'fs';
import * as path from 'path';

const PROGRESS_FILE = path.join(__dirname, '../scrape-progress.json');

interface ProgressState {
  completedCombinations: string[];
  totalBusinesses: number;
  totalReviewsAnalyzed: number;
  startedAt: string;
  lastUpdatedAt: string;
}

async function main() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    console.log('📊 Scrape Summary: No scraping started yet.');
    console.log('   Run: npx tsx scripts/scrape-reviews.ts');
    return;
  }

  const progress: ProgressState = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const totalCities = progress.completedCombinations.map(c => c.split('|')[0]);
  const uniqueCities = new Set(totalCities);
  const totalIndustries = progress.completedCombinations.map(c => c.split('|')[1]);
  const uniqueIndustries = new Set(totalIndustries);

  const started = new Date(progress.startedAt);
  const updated = new Date(progress.lastUpdatedAt);
  const elapsed = Math.round((updated.getTime() - started.getTime()) / 1000 / 60);

  console.log('\n📊 StarLoop Scrape Summary');
  console.log('─'.repeat(40));
  console.log(`Completed combinations : ${progress.completedCombinations.length}`);
  console.log(`Unique cities covered  : ${uniqueCities.size}`);
  console.log(`Unique industries      : ${uniqueIndustries.size}`);
  console.log(`Total businesses saved : ${progress.totalBusinesses}`);
  console.log(`Total reviews analyzed : ${progress.totalReviewsAnalyzed}`);
  console.log(`Started                : ${started.toLocaleString()}`);
  console.log(`Last updated           : ${updated.toLocaleString()}`);
  console.log(`Elapsed                : ${elapsed} minutes`);
  console.log('─'.repeat(40));
}

main().catch(console.error);
