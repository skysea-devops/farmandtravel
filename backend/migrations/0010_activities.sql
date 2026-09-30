-- 0010_activities.sql — community activity feed with a member-submit → admin-approve flow.
-- status: pending (submitted, awaiting review) | published (live) | rejected.
-- pinned: always-featured items (Özgür's founding podcast) shown on top regardless of date.
CREATE TABLE IF NOT EXISTS activities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    uuid REFERENCES members(id) ON DELETE SET NULL,
  author_name  text,                       -- display name (denormalized; seed or member firstName)
  kind         text NOT NULL,              -- video | photo | meeting | announcement
  title        text NOT NULL,
  description  text,
  image_key    text,                       -- S3 key for an uploaded photo
  image_url    text,                       -- external image (seed) fallback
  youtube_id   text,                       -- for kind = video
  place        text,
  event_at     text,                       -- meeting date/time (free text, e.g. "18 Eylül, 20:00 · Zoom")
  online       boolean,
  status       text NOT NULL DEFAULT 'pending',
  pinned       boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX IF NOT EXISTS activities_feed_idx ON activities (status, pinned DESC, published_at DESC);

-- Seed: the founding podcast (pinned) + the existing sample feed, all published.
INSERT INTO activities (kind, title, description, youtube_id, author_name, place, pinned, status, published_at) VALUES
  ('video', 'Toprakla Yeniden''in hikâyesi — Özgür ile',
   'Topluluk fikrinin sahibi ve kurucu üyemiz Özgür, Toprakla Yeniden''in nasıl doğduğunu ve nereye gittiğini anlatıyor.',
   'jOW8K7XUX4o', 'Özgür', 'Kurucu üye', true, 'published', '2026-09-22T10:00:00+03:00');

INSERT INTO activities (kind, title, description, event_at, online, author_name, status, published_at) VALUES
  ('meeting', 'Aylık topluluk buluşması (online)', 'Deneyim paylaşımı, yeni üyelerle tanışma ve soru-cevap. Herkes davetli.',
   '18 Eylül, 20:00 · Zoom', true, null, 'published', '2026-09-20T09:00:00+03:00'),
  ('meeting', 'Permakültür atölyesi (yüz yüze)', 'Sintra''daki çiftlikte uygulamalı permakültür atölyesi. Katılım sınırlı.',
   '6 Eylül, 10:00 · Sintra', false, null, 'published', '2026-09-08T09:00:00+03:00');

INSERT INTO activities (kind, title, description, image_url, author_name, place, status, published_at) VALUES
  ('photo', 'Hasat günü', 'Konya''daki çiftlikte gönüllülerle birlikte güzel bir hasat tamamladık. Emeği geçen herkese teşekkürler!',
   'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80', 'Deniz', '🇹🇷 Konya', 'published', '2026-09-16T09:00:00+03:00'),
  ('photo', 'Fidan dikimi', 'Berlin çevresindeki ağaçlandırma projesinde bir günde 300 fidan diktik.',
   'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', 'Jonas', '🇩🇪 Berlin', 'published', '2026-09-10T09:00:00+03:00');
