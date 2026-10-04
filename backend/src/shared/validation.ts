// Shared input validation helpers.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// True for a well-formed UUID. Guard route params with this before using them in a
// query so a malformed id returns 400/404 instead of a Postgres cast error (500).
export const isUuid = (s: string | undefined | null): s is string => !!s && UUID_RE.test(s);
