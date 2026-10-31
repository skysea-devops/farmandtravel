-- 0030_billing_gumroad.sql
-- Gumroad billing kolonları (LS reddedildi). members.plan yine entitlement; bu tablo
-- Gumroad webhook'unun tuttuğu billing kaydı. LS kolonları nullable kalır (geriye dönük).
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS gumroad_subscription_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS gumroad_sale_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS permalink text;    -- hangi ürün (market türetilir)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS recurrence text;   -- monthly|quarterly|biannually|yearly
-- Aynı aboneliğin yenilemeleri tek satırda toplansın.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_gumroad_sub_idx
  ON subscriptions(gumroad_subscription_id) WHERE gumroad_subscription_id IS NOT NULL;
