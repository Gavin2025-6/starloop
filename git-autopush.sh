#!/bin/bash
cd ~/Desktop/StarLoop
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Watching StarLoop for changes..."
while true; do
  if ! git diff --quiet || ! git diff --staged --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Changes detected, committing..."
    git add -A
    git commit -m "auto: $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null
    git push 2>/dev/null && echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pushed successfully" || echo "[$(date '+%Y-%m-%d %H:%M:%S')] Push failed (maybe no remote)"
  fi
  sleep 300
done
