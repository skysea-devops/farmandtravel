-- 0013_member_soft_delete.sql — account deletion = anonymize now, purge later.
-- Deleting an account no longer hard-deletes the row (which would CASCADE-remove the
-- other party's message/connection history). Instead we anonymize and stamp deleted_at;
-- a daily job hard-deletes rows older than 3 months (data-retention policy).
ALTER TABLE members ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON members(deleted_at) WHERE deleted_at IS NOT NULL;
