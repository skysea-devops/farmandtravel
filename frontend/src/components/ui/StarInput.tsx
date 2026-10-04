import { useState } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const LABELS = ["", t("Kötü", "Poor"), t("İdare eder", "Fair"), t("Fena değil", "Okay"), t("İyi", "Good"), t("Harika", "Great")];
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={t(`${i} yıldız`, `${i} stars`)}
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
        {shown ? `${shown}/5 · ${LABELS[shown]}` : t("Yıldıza dokun", "Tap a star")}
      </span>
    </div>
  );
}
