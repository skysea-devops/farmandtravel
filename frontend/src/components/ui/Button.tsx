import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'outline' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-field text-paper hover:bg-field-dark',
  outline: 'border border-field/30 text-ink hover:border-field hover:bg-field/5',
  ghost: 'text-ink hover:bg-ink/5',
}

/** Shared classes so <Link> can look like a button without duplicating styles. */
export function buttonClass(variant: Variant = 'primary', className?: string): string {
  return cn(base, variants[variant], className)
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />
}
