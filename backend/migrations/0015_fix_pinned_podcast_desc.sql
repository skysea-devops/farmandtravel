-- 0015_fix_pinned_podcast_desc.sql — 0014 zaten uygulanmış bir ortamda düzenlenemez;
-- sabit podcast'in nihai (doğru) başlık/açıklamasını yeni bir migration ile yaz.
-- Tek sabit video olduğundan pinned+video ile eşleştiriyoruz (youtube_id değişmiş olsa bile tutar).
UPDATE activities
   SET title = 'Topluluk, sürdürülebilir tarım ve yaratıcı işbirliği — Inna & Özgür',
       description = 'Inna ve Özgür bu bölümde topluluğun dönüştürücü gücünü, sürdürülebilir tarımı ve yaratıcı işbirliğini konuşuyor. Kişisel yolculukların ve toprakla kurulan bağın; hızla değişen bir dünyada kendine yeterliliği nasıl beslediğini anlatıyor.',
       author_name = 'Inna & Özgür',
       place = NULL
 WHERE pinned = true AND kind = 'video';
