-- New matching dimensions: workshops/training (offer↔seek), vehicle/logistics
-- (offer↔seek) and an "open to abroad / international" mutual signal. These give
-- onboarding more axes so match scores vary instead of clustering.
INSERT INTO taxonomy (axis, value, label_tr, label_en, synonyms) VALUES
  ('offer','workshops','Eğitim/atölye veriyorum','Offering workshops/training','{eğitim,atölye,workshop,kurs,öğretiyorum,eğitim veriyorum,atölye düzenliyorum}'),
  ('seek','workshops','Eğitim/atölye arıyorum','Looking for workshops/training','{eğitim,atölye,workshop,kurs,eğitim arıyorum,atölye arıyorum}'),
  ('offer','logistics','Araç/lojistik sağlayabilirim','Offering vehicle/logistics support','{araç,lojistik,ulaşım,nakliye,taşıma,araç desteği,araç sağlayabilirim}'),
  ('seek','logistics','Araç/lojistik arıyorum','Looking for vehicle/logistics support','{araç,lojistik,ulaşım,nakliye,taşıma,araç arıyorum}'),
  ('seek','international','Yurt dışına açığım','Open to abroad / international','{yurt dışı,yurtdışı,uluslararası,abroad,international,yurt dışına açık,yurt dışında}')
ON CONFLICT (axis, value) DO NOTHING;
