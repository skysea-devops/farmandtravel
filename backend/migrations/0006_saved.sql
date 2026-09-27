-- 0006_saved.sql — bookmarked members.
CREATE TABLE IF NOT EXISTS saved_members (
  saver_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  saved_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (saver_id, saved_id),
  CHECK (saver_id <> saved_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_saver ON saved_members(saver_id, created_at DESC);
