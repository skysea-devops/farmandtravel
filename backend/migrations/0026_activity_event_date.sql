-- 0026_activity_event_date.sql
-- Etkinlikler için yapısal tarih. Serbest metin event_at görüntü içindir; event_date
-- geçmiş kontrolü (katılım kapatma) için kullanılır.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS event_date timestamptz;

-- Seed mock buluşmalarına gerçek tarih ver ki geçmiş olarak işaretlensinler.
UPDATE activities SET event_date = '2026-09-18 20:00:00+03' WHERE kind = 'meeting' AND event_at LIKE '18 Eylül%';
UPDATE activities SET event_date = '2026-09-06 10:00:00+03' WHERE kind = 'meeting' AND event_at LIKE '6 Eylül%';
