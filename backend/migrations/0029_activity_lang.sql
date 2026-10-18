-- 0029_activity_lang.sql
-- Etkinliğin / içeriğin yapılacağı dil (buluşma ve video için). 'tr' | 'en' | 'both'.
-- Üyeler hangi dilde olduğunu görüp ona göre katılır; TR ve EN için ayrı etkinlik planlanır.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS lang text;
