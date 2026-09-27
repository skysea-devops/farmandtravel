-- 0005_reviews.sql — member-to-member reviews (stars + comment).
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  rating      int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (reviewer_id <> reviewee_id),
  UNIQUE (reviewer_id, reviewee_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id, created_at DESC);
