-- seed_taxonomy.sql — kontrollü taksonomi (AI çıkarım bu kümeye maplar)
-- axis: seek (arıyorum) | offer (sunuyorum) | topic (ilgi) | situation (durum)
INSERT INTO taxonomy (axis, value, label_tr, label_en, synonyms) VALUES
-- SITUATION (durum) — filtrelenebilir roller
('situation','farm-owner','Çiftlik sahibi','Farm owner','{çiftlik,farm,çiftçi,bağ,tarla,arazi sahibi}'),
('situation','aspiring-farmer','İleride çiftlik kuracak','Aspiring farm owner','{ileride çiftlik,çiftlik kuracağım,kendi çiftliğimi kuracağım,çiftlik hayali}'),
('situation','has-idea','Fikir/proje aşamasında','Has an idea/project','{hayal,proje,fikir,girişim}'),
('situation','seeking-experience','Deneyim arıyor','Seeking experience','{gönüllülük,deneyim,gezgin}'),
-- SEEK (arıyorum)
('seek','volunteers','Gönüllü arıyorum','Looking for volunteers','{gönüllü,işgücü,eleman,yardımcı}'),
('seek','mentor','Mentor arıyorum','Looking for a mentor','{mentor,rehber,danışman arıyorum,yol gösteren}'),
('seek','knowledge','Bilgi öğrenmek istiyorum','Looking to learn','{bilgi,öğrenmek,deneyim paylaşımı,eğitim}'),
('seek','partner','Ortak arıyorum','Looking for a partner','{ortak,partner,iş ortağı}'),
('seek','equipment','Ekipman arıyorum','Looking for equipment','{ekipman,malzeme,materyal,alet}'),
('seek','networking','Bağlantı kurmak istiyorum','Looking to network','{networking,ağ,tanışma,bağlantı}'),
('seek','funding','Finansal destekçi arıyorum','Looking for a funder','{finansal destek,yatırımcı,sponsor,fon}'),
('seek','hosting','Konaklama/deneyim fırsatı arıyorum','Looking for a hosting opportunity','{konaklama,farm stay,ev sahibi,deneyim fırsatı}'),
-- OFFER (sunuyorum)
('offer','place-experience','Yer & deneyim sunuyorum','Offering place & experience','{çiftlik,konaklama,farm stay,ev sahibi,deneyim sunuyorum}'),
('offer','volunteer-labor','Gönüllü olmak istiyorum','Offering to volunteer','{gönüllü olmak,emek,çalışabilirim,yardım edebilirim}'),
('offer','expertise','Uzmanlık sunuyorum','Offering expertise','{uzmanlık,danışmanlık,uzman,bilgi sunuyorum}'),
('offer','mentoring','Mentorluk yapabilirim','Offering mentoring','{mentor olabilirim,rehberlik,yol gösterebilirim}'),
('offer','partnership','Ortaklık kurabilirim','Offering partnership','{ortak olabilirim,partnerlik}'),
('offer','equipment','Ekipman sağlayabilirim','Offering equipment','{ekipman verebilirim,malzeme,materyal sağlarım}'),
('offer','funding','Finansal destek olabilirim','Offering funding','{yatırım yapabilirim,fon,sponsor olabilirim}'),
-- TOPIC (ilgi/kategori)
('topic','organic-farming','Organik tarım','Organic farming','{organik,tarım}'),
('topic','permaculture','Permakültür','Permaculture','{permakültür,permaculture}'),
('topic','eco-village','Eco-village','Eco-village','{ekoköy,eco village,köy topluluğu}'),
('topic','wildlife','Doğa & yaban hayatı','Wildlife','{yaban hayat,hayvan,wildlife,rehabilitasyon}'),
('topic','food-forest','Gıda ormanı','Food forest','{gıda ormanı,food forest,agroforestry}'),
('topic','reforestation','Ağaçlandırma','Reforestation','{ağaçlandırma,orman,fidan}'),
('topic','off-grid','Off-grid yaşam','Off-grid living','{off grid,şebekeden bağımsız,kendi kendine yeten}'),
('topic','regenerative','Rejeneratif tarım','Regenerative agriculture','{rejeneratif,regeneratif,toprak sağlığı}'),
('topic','animal-sanctuary','Hayvan barınağı','Animal sanctuary','{barınak,hayvan kurtarma,sığınak}')
ON CONFLICT (axis, value) DO NOTHING;
