-- Migrate jobs with status='quoted' to status='requested'
-- Safe to run multiple times (IF condition guards against no-op)
UPDATE "Job" SET status = 'requested' WHERE status = 'quoted';
