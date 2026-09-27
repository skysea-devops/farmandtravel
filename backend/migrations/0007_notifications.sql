-- 0007_notifications.sql — per-user activity notifications.
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,   -- recipient
  actor_id   uuid REFERENCES members(id) ON DELETE SET NULL,           -- who caused it
  type       text NOT NULL,   -- connection_request|connection_accepted|message|review
  data       jsonb NOT NULL DEFAULT '{}',
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
