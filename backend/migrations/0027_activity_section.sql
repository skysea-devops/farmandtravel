-- 0027_activity_section.sql
-- Aktivite bölümü (app Aktiviteler sayfasındaki üst sekmeler):
--   meetups       → Topluluk Buluşmaları (video)
--   knowledge     → Bilgi Paylaşımı (video / seminer)
--   member        → Üye Etkinlikleri (üye foto paylaşımları)
--   announcements → Duyurular (gelecek etkinlikler: buluşma + duyuru)
-- Aynı 'video' türü iki sekmeye ayrılabildiği için ayrı bir alan gerekiyor.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS section text;

UPDATE activities SET section = CASE
  WHEN kind = 'video' THEN 'knowledge'
  WHEN kind = 'photo' THEN 'member'
  ELSE 'announcements'
END
WHERE section IS NULL;
