-- Host adres doğrulama belgesi (yalnızca admin görür; profilde görünmez) +
-- kullanıcı şikayet/bildirim sistemi.
-- Idempotent.

ALTER TABLE members ADD COLUMN IF NOT EXISTS proof_address_key text;

CREATE TABLE IF NOT EXISTS reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  context     text,                              -- 'profile' | 'message' | null
  reason      text NOT NULL,
  handled     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_open ON reports(handled, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
