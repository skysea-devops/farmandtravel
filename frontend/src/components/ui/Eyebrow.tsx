import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-harvest',
        className,
      )}
    >
      {children}
    </span>
  )
}
