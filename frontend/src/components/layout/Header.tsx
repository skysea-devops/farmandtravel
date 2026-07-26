import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SITE } from '@/config/site'
import { buttonClass } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-stone/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" onClick={() => setOpen(false)} className="font-display text-xl tracking-tight text-ink">
          Farm <span className="italic text-harvest">&amp;</span> Travel
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {SITE.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink',
                  isActive && 'text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <span className="mx-2 h-5 w-px bg-stone" />
          <Link to="/pricing" className={buttonClass('primary')}>
            Join
          </Link>
        </nav>

        {/* Mobile: Join + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link to="/pricing" onClick={() => setOpen(false)} className={buttonClass('primary', 'px-4 py-2')}>
            Join
          </Link>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone text-ink"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <nav className="border-t border-stone/70 bg-paper px-5 py-2 sm:hidden">
          {SITE.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-3 text-ink-soft transition-colors hover:bg-ink/5',
                  isActive && 'text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
