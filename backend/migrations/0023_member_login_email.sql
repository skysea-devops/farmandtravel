-- Üyenin Cognito giriş e-postasını sakla. Onboarding'de takılanlar profil adımına
-- gelmediği için contact_email boş kalıyor ve admin panelinde kim oldukları
-- anlaşılamıyordu. login_email her auth'ta JWT email claim'inden doldurulur.
-- Idempotent.
ALTER TABLE members ADD COLUMN IF NOT EXISTS login_email text;
