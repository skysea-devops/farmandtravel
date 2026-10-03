-- 0012_review_moderation.sql — review publishing pipeline.
-- A review is one rating (required) + optional comment. New rules:
--   * 5 stars + clean comment  -> moderation='auto' (publishes once the other
--     side also reviews, or 15 days after it was written — mutual-reveal window).
--   * 4 stars or below          -> moderation='held' (admin must approve).
--   * profane/abusive comment   -> moderation='held' (caught automatically).
--   * admin approve/reject      -> moderation='approved' | 'rejected'.
-- Visibility is computed at read time by the visible_reviews view, so the
-- 15-day window needs no scheduler.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS moderation   text NOT NULL DEFAULT 'auto'
    CHECK (moderation IN ('auto', 'held', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS flagged      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_note   text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES members(id) ON DELETE SET NULL;

-- Keep any reviews that already existed visible (they predate moderation).
UPDATE reviews SET moderation = 'approved' WHERE moderation = 'auto' AND created_at < now() - interval '1 minute';

-- Fast admin queue lookups.
CREATE INDEX IF NOT EXISTS idx_reviews_held ON reviews(created_at DESC) WHERE moderation = 'held';

-- A review is publicly visible when:
--   * an admin approved it, OR
--   * it's auto AND (15 days have passed OR the other party has also reviewed).
CREATE OR REPLACE VIEW visible_reviews AS
SELECT r.*
  FROM reviews r
 WHERE r.moderation = 'approved'
    OR (
      r.moderation = 'auto'
      AND (
        now() >= r.created_at + interval '15 days'
        OR EXISTS (
          SELECT 1 FROM reviews r2
           WHERE r2.reviewer_id = r.reviewee_id
             AND r2.reviewee_id = r.reviewer_id
             AND r2.moderation <> 'rejected'
        )
      )
    );
