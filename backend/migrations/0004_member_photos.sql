-- 0004_member_photos.sql — member gallery photos (S3 keys).
CREATE TABLE IF NOT EXISTS member_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  s3_key     text NOT NULL,
  caption    text,
  sort       int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_member_photos_member ON member_photos(member_id, sort, created_at);
