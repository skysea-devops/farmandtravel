import { Link } from 'react-router-dom'
import { SITE } from '@/config/site'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-stone/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-lg text-ink">
            Farm <span className="italic text-harvest">&amp;</span> Travel
          </div>
          <p className="mt-1 max-w-sm text-sm text-ink-soft">
            Stay and work on farms and in villages. We connect people — we never move money
            between them.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          {SITE.nav.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
