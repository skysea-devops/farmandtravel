// Turkish date/time helpers for message timestamps.

// Full message timestamp, e.g. "3 Eki 14:30" (adds the year if it's not this year).
export function msgTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Compact timestamp for conversation lists: time only if today, else day + month.
export function listTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const today = d.toDateString() === now.toDateString();
  if (today) return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: sameYear ? undefined : "numeric" });
}
