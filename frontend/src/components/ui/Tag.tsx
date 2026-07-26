import type { ReactNode } from 'react'

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-stone bg-surface px-2.5 py-0.5 text-xs text-ink-soft">
      {children}
    </span>
  )
}
