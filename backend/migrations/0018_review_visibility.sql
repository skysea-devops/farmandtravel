-- 0018_review_visibility.sql — decouple moderation from reveal; make reveal monotonic.
--
-- Problems fixed (end-to-end audit):
--   * Admin approval made a review visible immediately, bypassing the mutual/15-day
--     reveal window (blind-review bypass). Now 'approved' reveals on the SAME timing
--     as 'auto' — only once the other side has also reviewed, or 15 days have passed.
--   * Reciprocity used "r2.moderation <> 'rejected'", so rejecting the other side's
--     review could UN-reveal an already-visible review. Reciprocity is now "the other
--     side has submitted a review at all" (any state) — once they commit a rating they
--     can't change it, so the blind purpose is served and reveal never reverses.
--   * Suspended/deleted reviewers' reviews still counted toward ratings. Now excluded.
--   * New 'removed' moderation state lets an admin hide an already-published review.

-- Allow the new 'removed' state.
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'reviews'::regclass AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%moderation%';
  IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE reviews DROP CONSTRAINT %I', c); END IF;
END $$;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_moderation_check
  CHECK (moderation IN ('auto', 'held', 'approved', 'rejected', 'removed'));

-- A review is publicly visible when:
--   * its moderation is 'auto' or 'approved' (not held/rejected/removed), AND
--   * its author is an active member (not suspended/deleted), AND
--   * the reveal window is open: 15 days have passed OR the other party has also
--     submitted a review (any state — reciprocity is monotonic).
CREATE OR REPLACE VIEW visible_reviews AS
SELECT r.*
  FROM reviews r
  JOIN members rv ON rv.id = r.reviewer_id
 WHERE r.moderation IN ('auto', 'approved')
   AND rv.status NOT IN ('suspended', 'deleted')
   AND (
     now() >= r.created_at + interval '15 days'
     OR EXISTS (
       SELECT 1 FROM reviews r2
        WHERE r2.reviewer_id = r.reviewee_id
          AND r2.reviewee_id = r.reviewer_id
     )
   );
