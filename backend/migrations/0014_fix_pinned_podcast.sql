-- 0014_fix_pinned_podcast.sql — correct the pinned founding podcast's title/description
-- to reflect the actual episode (Inna & Özgür: community, sustainable farming, creative
-- collaboration). Keeps the same video and pinned state.
UPDATE activities
   SET title = 'Topluluk, sürdürülebilir tarım ve yaratıcı işbirliği — Inna & Özgür',
       description = 'Inna ve Özgür bu bölümde topluluğun dönüştürücü gücünü, sürdürülebilir tarımı ve yaratıcı işbirliğini konuşuyor. Kişisel yolculukların ve toprakla kurulan bağın; hızla değişen bir dünyada kendine yeterliliği nasıl beslediğini anlatıyor.',
       author_name = 'Inna & Özgür',
       place = NULL
 WHERE youtube_id = 'jOW8K7XUX4o' AND pinned = true;
