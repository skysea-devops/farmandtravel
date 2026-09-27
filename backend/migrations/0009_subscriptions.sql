-- 0009_subscriptions.sql — Lemon Squeezy subscriptions (one active row per member).
-- members.plan is the entitlement ('none' | 'frontier' | 'active'); this table is the
-- billing record the webhook keeps in sync.
CREATE TABLE IF NOT EXISTS subscriptions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id          uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  provider           text NOT NULL DEFAULT 'lemonsqueezy',
  ls_subscription_id text UNIQUE,
  ls_customer_id     text,
  ls_variant_id      text,
  status             text NOT NULL,          -- active|on_trial|past_due|cancelled|expired|unpaid|paused
  market             text,                   -- tr | intl
  renews_at          timestamptz,
  ends_at            timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_member_idx ON subscriptions(member_id);
