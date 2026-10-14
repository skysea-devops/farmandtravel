-- 0025_activity_access_and_join.sql
-- Aktivite freemium erişim katmanı + katılım (RSVP).
--   access: 'public'  → herkese/ücretsiz üyeye açık (Özgür tanıtım/podcast, reklam içerik)
--           'members' → yalnızca paralı üye izler/katılır (seminer kaydı, etkinlik)
-- duration_min: video/seminer süresi (teaser kartta "45 dk").
-- detail: katılım şartları / uzun açıklama (yalnızca kilidi açık görür).
-- link: kayıt/katılım linki (yalnızca kilidi açık görür).
ALTER TABLE activities ADD COLUMN IF NOT EXISTS access       text NOT NULL DEFAULT 'members';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS duration_min int;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS detail       text;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS link         text;

-- Sabitlenmiş tanıtım içeriği (Özgür'ün kurucu podcast'i) herkese açık; kalanlar members.
UPDATE activities SET access = 'public' WHERE pinned = true;

-- Katılım / RSVP.
CREATE TABLE IF NOT EXISTS activity_participants (
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES members(id)    ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, member_id)
);
CREATE INDEX IF NOT EXISTS activity_participants_activity_idx ON activity_participants (activity_id);
