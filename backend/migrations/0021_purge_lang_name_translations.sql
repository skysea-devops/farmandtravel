-- Dil adlarının yanlış çevrilmiş önbellek kayıtlarını temizle.
-- Örn: "English" (tr hedefi) yanlışlıkla "Turkish" olarak önbelleğe alınmıştı.
-- Bu satırları silince düzeltilmiş prompt ile yeniden çevrilip doğru değer ("İngilizce") önbelleğe girer.
-- Idempotent: tekrar çalıştırmak güvenli.
DELETE FROM translations
WHERE lower(source_text) IN (
  'english','turkish','german','french','spanish','portuguese','italian','arabic','russian',
  'türkçe','ingilizce','i̇ngilizce','almanca','fransızca','ispanyolca','portekizce','italyanca','arapça','rusça'
);
