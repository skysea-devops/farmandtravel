-- 0002_connections.sql — connection requests between members.
CREATE TABLE IF NOT EXISTS connections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending',   -- pending|accepted|rejected
  message      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (requester_id <> addressee_id)
);

-- One connection per unordered pair (prevents duplicate/crossed requests).
CREATE UNIQUE INDEX IF NOT EXISTS uq_connections_pair
  ON connections (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON connections(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id, status);
