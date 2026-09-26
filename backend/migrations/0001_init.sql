-- 0001_init.sql — members + taxonomy + member_tags (Sprint 1 dikey dilimi)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub   text UNIQUE NOT NULL,
  status        text NOT NULL DEFAULT 'onboarding',   -- onboarding|profile_complete|active|suspended
  -- PUBLIC alanlar (bağlantı öncesi görünür)
  first_name    text,
  country       text,
  city          text,                                 -- şehir public (harita), tam adres gizli
  languages     text[] NOT NULL DEFAULT '{}',
  headline      text,
  bio           text,
  avatar_key    text,
  -- PRIVATE alanlar (yalnız accepted connection'da açılır)
  last_name     text,
  contact_email text,
  phone         text,
  socials       jsonb,
  employer      text,
  address_exact text,
  -- serbest/koşullu profil verisi + onboarding taslağı
  profile       jsonb NOT NULL DEFAULT '{}',
  draft         jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS taxonomy (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  axis     text NOT NULL,                             -- seek|offer|topic|situation
  value    text NOT NULL,                             -- slug
  label_tr text NOT NULL,
  label_en text NOT NULL,
  synonyms text[] NOT NULL DEFAULT '{}',
  active   boolean NOT NULL DEFAULT true,
  UNIQUE (axis, value)
);

CREATE TABLE IF NOT EXISTS member_tags (
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  taxonomy_id uuid NOT NULL REFERENCES taxonomy(id),
  axis        text NOT NULL,
  value       text NOT NULL,
  PRIMARY KEY (member_id, taxonomy_id)
);
CREATE INDEX IF NOT EXISTS idx_member_tags_axis_value ON member_tags(axis, value);
CREATE INDEX IF NOT EXISTS idx_member_tags_member ON member_tags(member_id);
