-- 0011_official_member.sql — the official "Toprakla Yeniden" account.
-- A real member row (never logs in) used to send the welcome message and admin
-- broadcasts through the normal connection+message plumbing.
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

INSERT INTO members (cognito_sub, first_name, status, plan, is_official)
VALUES ('system:toprakla', 'Toprakla Yeniden', 'active', 'frontier', true)
ON CONFLICT (cognito_sub) DO NOTHING;
