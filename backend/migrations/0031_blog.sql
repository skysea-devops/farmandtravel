-- 0031_blog.sql
-- Topluluk blogu — bilgilendirici yazılar. Tek dilde yazılır; public uçlar görüntüleyenin
-- diline (reqLang) göre translateFields ile otomatik çevrilir (Bedrock). body markdown.
CREATE TABLE IF NOT EXISTS blog_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  excerpt      text,                 -- kısa özet (liste + meta)
  body         text NOT NULL,        -- markdown
  cover_key    text,                 -- kapak görseli S3 key (gallery/<adminId>/...)
  author_name  text,
  status       text NOT NULL DEFAULT 'draft',  -- draft | published
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_published_idx ON blog_posts(status, published_at DESC);
