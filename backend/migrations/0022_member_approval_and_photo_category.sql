-- Üye onay kapısı + host fotoğraf kategorisi.
-- Yeni üyeler Keşfet'e düşmeden önce admin onayından geçer: approved_at NULL iken
-- Keşfet'te/eşleşmelerde görünmez; admin onaylayınca approved_at damgalanır.
-- member_photos.category: host fotoğraflarını kategorilere ayırır (çiftlik geneli, yatma yeri vb.).
-- Idempotent.

ALTER TABLE members ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE member_photos ADD COLUMN IF NOT EXISTS category text;

-- Mevcut tüm üyeler (ve resmi hesaplar) onaylı sayılsın ki bu değişiklik
-- şu an Keşfet'te görünenleri aniden gizlemesin. Sadece yeni kayıtlar onay bekler.
UPDATE members SET approved_at = now() WHERE approved_at IS NULL AND status <> 'deleted';
