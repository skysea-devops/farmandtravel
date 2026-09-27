import { cn } from "@/lib/cn";

// Read-only star rating (rounds to nearest whole star).
export function Stars({ value, className }: { value: number; className?: string }) {
  const n = Math.round(value);
  return (
    <span className={cn("tracking-tight text-clay-500", className)} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "" : "text-border-strong"}>★</span>
      ))}
    </span>
  );
}
