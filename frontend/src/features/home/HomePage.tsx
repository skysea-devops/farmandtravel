import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Tag } from '@/components/ui/Tag'
import { Stars } from '@/components/ui/Stars'
import { buttonClass } from '@/components/ui/Button'
import { HOSTS } from '@/data/mock'
import { ACTIVITIES, activityLabel } from '@/config/taxonomy'

const STEPS = [
  { n: '01', title: 'Find a host', body: 'Browse farms and villages by country, what you’ll do, and season.' },
  { n: '02', title: 'Apply', body: 'Send a short application. Hosts reply, and you agree the details together.' },
  { n: '03', title: 'Stay & work', body: 'Trade a few hours of help a day for a bed, meals, and a season on the land.' },
]

export function HomePage() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  function search() {
    navigate(q.trim() ? `/hosts?q=${encodeURIComponent(q.trim())}` : '/hosts')
  }

  const featured = HOSTS.slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-10 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow>Farm &amp; village stays</Eyebrow>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
              Work the land.
              <br />
              <span className="italic text-field">Live the village.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink-soft">
              Spend a season on an organic farm, a mountain dairy, a food forest. Lend a few hours a
              day; get a bed, real meals, and a way of life. No money changes hands — just a fair
              exchange.
            </p>

            <div className="mt-8 flex max-w-md items-center gap-2 rounded-full border border-stone bg-surface p-1.5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="Try a country, region, or ‘olive harvest’…"
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-ink placeholder:text-ink-soft/60 focus:outline-none"
                aria-label="Search hosts"
              />
              <button className={buttonClass('primary')} onClick={search} type="button">
                Search
              </button>
            </div>
            <Link to="/hosts" className="mt-3 inline-block text-sm text-field hover:underline">
              or browse all hosts →
            </Link>
          </div>

          {/* Framed hero image */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-stone">
              <img
                src="/img/farmworker3.jpg"
                alt="Two people working together in a green field"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 left-6 rounded-full border border-stone bg-paper px-4 py-2 text-sm text-ink shadow-sm">
              <span className="font-display italic text-harvest">A fair exchange</span> — hours for a home
            </div>
          </div>
        </div>
      </section>

      {/* Browse by what you'll do */}
      <section className="mx-auto max-w-6xl px-5 pt-14">
        <div className="rule-seed mb-6">
          <Eyebrow className="text-stone">What you’ll do</Eyebrow>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.slice(0, 9).map((a) => (
            <Link
              key={a.id}
              to={`/hosts?activity=${a.id}`}
              className="rounded-full border border-stone bg-surface px-4 py-2 text-sm text-ink transition-colors hover:border-field hover:bg-field/5"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured hosts */}
      <section className="mx-auto max-w-6xl px-5 pt-16">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-3xl text-ink">Fresh on the land</h2>
          <Link to="/hosts" className="text-sm text-field hover:underline">
            See all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((host) => (
            <Link
              key={host.id}
              to={`/hosts/${host.id}`}
              className="group overflow-hidden rounded-2xl border border-stone bg-surface transition-colors hover:border-field/50"
            >
              <div className="overflow-hidden">
                <img
                  src={host.photos[0]}
                  alt={host.farmName}
                  loading="lazy"
                  className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg leading-snug text-ink">{host.farmName}</h3>
                <div className="text-xs uppercase tracking-wider text-ink-soft">
                  {host.region}, {host.country}
                </div>
                <div className="mt-2">
                  <Stars rating={host.rating} count={host.reviewCount} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {host.activities.slice(0, 3).map((a) => (
                    <Tag key={a}>{activityLabel(a)}</Tag>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 pt-20">
        <Eyebrow>How it works</Eyebrow>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="font-display text-2xl text-harvest">{s.n}</div>
              <h3 className="mt-2 font-display text-xl text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
        <Link to="/how-it-works" className="mt-6 inline-block text-sm text-field hover:underline">
          More on how it works →
        </Link>
      </section>

      {/* Membership note */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-stone bg-surface p-6">
            <div className="text-xs uppercase tracking-wider text-ink-soft">For Explorers</div>
            <h3 className="mt-2 font-display text-xl text-ink">Experience Explorer</h3>
            <div className="mt-1 text-sm text-harvest">€35 / year</div>
            <p className="mt-3 text-sm text-ink-soft">Browse, favourite, apply, and message hosts.</p>
          </div>
          <div className="rounded-2xl border border-stone bg-surface p-6">
            <div className="text-xs uppercase tracking-wider text-ink-soft">For hosts</div>
            <h3 className="mt-2 font-display text-xl text-ink">Experience Host</h3>
            <div className="mt-1 text-sm text-harvest">Free</div>
            <p className="mt-3 text-sm text-ink-soft">Publish your farm, receive and manage applicants.</p>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="flex flex-col items-start gap-5 rounded-3xl bg-field px-8 py-12 text-paper sm:flex-row sm:items-center sm:justify-between">
          <h2 className="max-w-md font-display text-3xl leading-tight">Find your season on the land.</h2>
          <div className="flex gap-3">
            <Link to="/hosts" className={buttonClass('primary', 'bg-paper text-field hover:bg-harvest-soft')}>
              Browse hosts
            </Link>
            <Link
              to="/pricing"
              className={buttonClass('outline', 'border-paper/40 text-paper hover:border-paper hover:bg-paper/10')}
            >
              See membership
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
