-- Demo members for discovery/matching. cognito_sub 'demo-*' => no real login.
-- Idempotent. Remove later with: DELETE FROM members WHERE cognito_sub LIKE 'demo-%';
INSERT INTO members (cognito_sub, status, first_name, country, city, headline, bio, languages) VALUES
  ('demo-marta','active','Marta','Portekiz','Sintra','Permakültür çiftliği sahibi','Sintra yakınlarında küçük bir permakültür çiftliği işletiyorum; hasat döneminde gönüllü ağırlıyorum.','{Portekizce,İngilizce}'),
  ('demo-jonas','active','Jonas','Almanya','Berlin','Ekolog & ağaçlandırma gönüllüsü','Berlin çevresinde ağaçlandırma projeleri yürütüyorum; deneyimimi paylaşmaktan ve mentorluk yapmaktan mutluluk duyarım.','{Almanca,İngilizce}'),
  ('demo-deniz','active','Deniz','Türkiye','Konya','Ziraat mühendisi','Organik tarım ve toprak sağlığı üzerine danışmanlık veriyorum.','{Türkçe}'),
  ('demo-elif','active','Elif','Türkiye','İzmir','Çiftlik kurma hayali olan girişimci','Ege''de küçük bir çiftlik kurmak istiyorum; yol gösterecek mentor ve birlikte üretecek ortak arıyorum.','{Türkçe,İngilizce}'),
  ('demo-ayse','active','Ayşe','Türkiye','Muğla','Gıda ormanı sahibi','Muğla''da bir gıda ormanı kurdum; öğrenmek isteyen gönüllüleri ağırlıyorum.','{Türkçe}'),
  ('demo-lars','active','Lars','Hollanda','Amsterdam','Eko-yatırımcı','Sürdürülebilir tarım ve eko-köy projelerine finansal destek sağlıyorum.','{Felemenkçe,İngilizce}')
ON CONFLICT (cognito_sub) DO NOTHING;

INSERT INTO member_tags (member_id, taxonomy_id, axis, value)
SELECT m.id, tx.id, tx.axis, tx.value
FROM (VALUES
  ('demo-marta','situation','farm-owner'),
  ('demo-marta','offer','place-experience'),
  ('demo-marta','seek','volunteers'),
  ('demo-marta','topic','permaculture'),
  ('demo-jonas','offer','expertise'),
  ('demo-jonas','offer','mentoring'),
  ('demo-jonas','topic','reforestation'),
  ('demo-deniz','offer','expertise'),
  ('demo-deniz','topic','organic-farming'),
  ('demo-elif','situation','has-idea'),
  ('demo-elif','seek','mentor'),
  ('demo-elif','seek','partner'),
  ('demo-elif','topic','permaculture'),
  ('demo-ayse','situation','farm-owner'),
  ('demo-ayse','offer','place-experience'),
  ('demo-ayse','seek','volunteers'),
  ('demo-ayse','topic','food-forest'),
  ('demo-lars','offer','funding'),
  ('demo-lars','seek','partner'),
  ('demo-lars','topic','eco-village')
) AS d(sub, axis, value)
JOIN members m ON m.cognito_sub = d.sub
JOIN taxonomy tx ON tx.axis = d.axis AND tx.value = d.value
ON CONFLICT (member_id, taxonomy_id) DO NOTHING;
