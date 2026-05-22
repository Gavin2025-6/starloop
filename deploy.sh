#!/bin/bash
set -e
PRODUCT="StarLoop"
LOG_FILE="$HOME/Desktop/FactoryOS/logs/deploy-starloop.log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === $PRODUCT Deploy Start ===" | tee -a "$LOG_FILE"

cd ~/Desktop/StarLoop

# 1. Git commit and push
if ! git diff --quiet || ! git diff --staged --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add -A
  git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')" 2>&1 | tee -a "$LOG_FILE"
  git push 2>&1 | tee -a "$LOG_FILE" || echo "Push failed, continuing..." | tee -a "$LOG_FILE"
else
  echo "No git changes to commit" | tee -a "$LOG_FILE"
fi

# 2. Railway deploy
echo "Deploying to Railway..." | tee -a "$LOG_FILE"
npx @railway/cli up --detach 2>&1 | tee -a "$LOG_FILE"

# 3. Wait and verify (max 120s)
echo "Waiting for deploy to complete..." | tee -a "$LOG_FILE"
URL="https://starloop-production.up.railway.app"
SUCCESS=false
for i in $(seq 1 12); do
  sleep 10
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" 2>/dev/null || echo "000")
  echo "  Attempt $i: HTTP $STATUS" | tee -a "$LOG_FILE"
  if [ "$STATUS" != "000" ] && [ "$STATUS" -lt 500 ] 2>/dev/null; then
    SUCCESS=true
    break
  fi
done

if [ "$SUCCESS" = true ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Deploy SUCCESS: $URL" | tee -a "$LOG_FILE"
  # Notify FactoryOS
  curl -s -X POST http://localhost:3001/api/deploy-status \
    -H "Content-Type: application/json" \
    -d "{\"product\":\"$PRODUCT\",\"status\":\"success\",\"url\":\"$URL\"}" > /dev/null 2>&1 || true
  exit 0
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Deploy FAILED after timeout" | tee -a "$LOG_FILE"
  # Retry once
  echo "Retrying deploy..." | tee -a "$LOG_FILE"
  npx @railway/cli up --detach 2>&1 | tee -a "$LOG_FILE"
  curl -s -X POST http://localhost:3001/api/deploy-status \
    -H "Content-Type: application/json" \
    -d "{\"product\":\"$PRODUCT\",\"status\":\"failed\",\"url\":\"$URL\"}" > /dev/null 2>&1 || true
  exit 1
fi
