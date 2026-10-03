import { useState } from "react";
import { cn } from "@/lib/cn";

const LABELS = ["", "Kötü", "İdare eder", "Fena değil", "İyi", "Harika"];

// Interactive star picker. Big tap targets, hover preview, and a live text label
// so it's obvious that a rating registered — users kept missing that the send
// step needs a star selected first.
export function StarInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i} yıldız`}
            aria-pressed={i <= value}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            className={cn(
              "text-[36px] leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:scale-110",
              i <= shown ? "text-clay-500" : "text-border-strong",
            )}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-ink-600">
        {shown ? `${shown}/5 · ${LABELS[shown]}` : "Yıldıza dokun"}
      </span>
    </div>
  );
}
