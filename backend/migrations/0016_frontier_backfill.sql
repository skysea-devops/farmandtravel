-- 0016_frontier_backfill.sql — grandfather existing members as free "frontier".
-- The plan column was added with DEFAULT 'none', so members who existed before that
-- stayed 'none' and would be locked out after the paywall date. Anyone who joined
-- before the frontier cutoff is free; flip their plan here. Idempotent (none→frontier).
UPDATE members
   SET plan = 'frontier'
 WHERE plan = 'none'
   AND status <> 'deleted'
   AND is_official = false
   AND created_at < '2026-10-10T00:00:00+03:00';
