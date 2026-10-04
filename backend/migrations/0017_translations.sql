-- 0017_translations.sql — on-read machine-translation cache.
-- User-visible free text (member bios, activity posts, review comments, messages)
-- is stored in the author's language. On the English site we translate on read via
-- Bedrock (Haiku) and cache the result here, keyed by a hash of the source text and
-- the target language, so each distinct string is translated at most once.
CREATE TABLE IF NOT EXISTS translations (
  source_hash text        NOT NULL,            -- sha256 hex of the trimmed source text
  target_lang text        NOT NULL,            -- 'en' (base 'tr' is never translated)
  source_text text        NOT NULL,            -- original (kept for audit / re-translate)
  translated  text        NOT NULL,            -- machine translation
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_hash, target_lang)
);
