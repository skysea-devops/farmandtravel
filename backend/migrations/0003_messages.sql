-- 0003_messages.sql — 1:1 messages within an accepted connection.
CREATE TABLE IF NOT EXISTS messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  read_at       timestamptz
);
CREATE INDEX IF NOT EXISTS idx_messages_conn ON messages(connection_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(connection_id, sender_id) WHERE read_at IS NULL;
