import { cn } from '@/lib/cn'

export function Stars({
  rating,
  count,
  className,
}: {
  rating: number
  count?: number
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100))
  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label={`${rating.toFixed(1)} out of 5`}>
      <span className="relative inline-block whitespace-nowrap leading-none" aria-hidden>
        <span className="text-stone">★★★★★</span>
        <span className="absolute inset-0 overflow-hidden text-harvest" style={{ width: `${pct}%` }}>
          ★★★★★
        </span>
      </span>
      <span className="text-sm text-ink-soft">
        {rating.toFixed(1)}
        {count != null && <span className="text-stone"> · {count} reviews</span>}
      </span>
    </span>
  )
}
