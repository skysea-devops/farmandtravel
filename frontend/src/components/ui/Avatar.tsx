import { cn } from "@/lib/cn";

// Shows the uploaded photo when present, else the brand gradient placeholder.
// Size comes from className (e.g. "size-11").
export function Avatar({ url, className }: { url?: string | null; className?: string }) {
  const base = cn("shrink-0 rounded-full bg-linear-135 from-moss-300 to-clay-500 bg-cover bg-center", className);
  return url ? <div className={base} style={{ backgroundImage: `url(${url})` }} /> : <div className={base} />;
}
