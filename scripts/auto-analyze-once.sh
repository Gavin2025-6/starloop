#!/bin/bash
export PATH="/usr/local/bin:/usr/bin:/bin"
cd /Users/zhenyonggao/Desktop/StarLoop

set -a
[ -f .env.local ] && source .env.local
set +a

TS="[$(date '+%Y-%m-%d %H:%M:%S')]"
PENDING=$(/usr/local/bin/node -e "
  const { Pool } = require('pg');
  const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  db.query('SELECT COUNT(*) as c FROM \"ReviewQueue\" WHERE \"analysisStatus\" = \$1', ['PENDING'])
    .then(r => { process.stdout.write(r.rows[0].c+'\n'); return db.end(); })
    .catch(() => { process.stdout.write('0\n'); });
" 2>/dev/null || echo "0")

echo "$TS PENDING: ${PENDING}"
if [ "${PENDING:-0}" -gt 0 ] 2>/dev/null; then
  echo "$TS Analyzing up to 200 reviews..."
  /usr/local/bin/npx tsx scripts/analyze-reviews.ts --batch 200 --delay 300
  echo "$TS Done."
fi
