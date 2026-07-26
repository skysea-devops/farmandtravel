import { Link } from 'react-router-dom'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { buttonClass } from '@/components/ui/Button'
import { MEMBERSHIPS } from '@/config/membership'

export function PricingPage() {
  // Module 1 only for now — Explorer (paid) + Host (free).
  const plans = MEMBERSHIPS.filter((m) => m.module === 'experiences')

  return (
    <div className="mx-auto max-w-4xl px-5 pt-14">
      <Eyebrow>Membership</Eyebrow>
      <h1 className="mt-4 font-display text-4xl text-ink">Simple, honest pricing.</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Hosting is free. Explorers pay one yearly membership — that’s the only money we take. No
        commissions, no fees between you and your host.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {plans.map((m) => {
          const isPaid = m.price.interval !== 'free'
          return (
            <div
              key={m.id}
              className={
                isPaid
                  ? 'rounded-3xl border-2 border-field bg-surface p-8'
                  : 'rounded-3xl border border-stone bg-surface p-8'
              }
            >
              <div className="text-xs uppercase tracking-wider text-ink-soft">
                {isPaid ? 'For Explorers' : 'For hosts'}
              </div>
              <h2 className="mt-2 font-display text-2xl text-ink">{m.name}</h2>
              <div className="mt-2 font-display text-3xl text-field">
                {m.priceLabel}
              </div>
              <p className="mt-3 text-sm text-ink-soft">{m.tagline}</p>
              <ul className="mt-5 space-y-2 text-sm text-ink-soft">
                {m.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span aria-hidden className="text-field">·</span>
                    {h}
                  </li>
                ))}
              </ul>
              <Link to="/hosts" className={buttonClass(isPaid ? 'primary' : 'outline', 'mt-7 w-full')}>
                {isPaid ? 'Get started' : 'List your farm'}
              </Link>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Accounts and checkout open shortly — payments run through Lemon Squeezy, which handles EU VAT.
      </p>
    </div>
  )
}
