import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

// Read-only star rating (rounds to nearest whole star).
export function Stars({ value, className }: { value: number; className?: string }) {
  const n = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-clay-500", className)} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("size-3.5", i <= n ? "fill-current" : "text-border-strong")} strokeWidth={1.5} />
      ))}
    </span>
  );
}
