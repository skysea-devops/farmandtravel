import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { ActivityId, FarmTypeId } from '@/types/domain'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Tag } from '@/components/ui/Tag'
import { Stars } from '@/components/ui/Stars'
import { HOSTS } from '@/data/mock'
import { ACTIVITIES, FARM_TYPES, activityLabel, farmTypeLabel } from '@/config/taxonomy'
import { cn } from '@/lib/cn'

const COUNTRIES = Array.from(new Set(HOSTS.map((h) => h.country))).sort()

export function HostsPage() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const initialActivity = params.get('activity') as ActivityId | null
  const [activities, setActivities] = useState<ActivityId[]>(initialActivity ? [initialActivity] : [])
  const [country, setCountry] = useState('all')
  const [farmType, setFarmType] = useState<'all' | FarmTypeId>('all')

  function toggleActivity(id: ActivityId) {
    setActivities((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }
  function clearAll() {
    setQ('')
    setActivities([])
    setCountry('all')
    setFarmType('all')
  }

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return HOSTS.filter((host) => {
      if (country !== 'all' && host.country !== country) return false
      if (farmType !== 'all' && !host.farmTypes.includes(farmType)) return false
      if (activities.length && !activities.some((a) => host.activities.includes(a))) return false
      if (needle) {
        const hay = `${host.farmName} ${host.region} ${host.country} ${host.helpSummary} ${host.farmTypes
          .map(farmTypeLabel)
          .join(' ')}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [q, activities, country, farmType])

  const hasFilters = q.trim() !== '' || activities.length > 0 || country !== 'all' || farmType !== 'all'

  return (
    <div className="mx-auto max-w-6xl px-5 pt-14">
      <Eyebrow>Farm &amp; village hosts</Eyebrow>
      <h1 className="mt-4 font-display text-4xl text-ink">Hosts</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        {results.length} {results.length === 1 ? 'farm' : 'farms'} opening their gates to Explorers.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filter rail */}
        <aside className="h-fit space-y-6 rounded-2xl border border-stone bg-surface p-5 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-ink">Filters</span>
            {hasFilters && (
              <button onClick={clearAll} className="text-xs text-field hover:underline" type="button">
                Clear
              </button>
            )}
          </div>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-ink-soft">Search</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Farm, region…"
              className="w-full rounded-lg border border-stone bg-paper px-3 py-2 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-ink-soft">Country</span>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-stone bg-paper px-3 py-2">
              <option value="all">Any country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-ink-soft">Farm type</span>
            <select value={farmType} onChange={(e) => setFarmType(e.target.value as 'all' | FarmTypeId)} className="w-full rounded-lg border border-stone bg-paper px-3 py-2">
              <option value="all">Any type</option>
              {FARM_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-2 block text-xs uppercase tracking-wider text-ink-soft">Activity</span>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITIES.map((a) => {
                const on = activities.includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleActivity(a.id)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs transition-colors',
                      on ? 'border-field bg-field text-paper' : 'border-stone bg-paper text-ink-soft hover:border-field',
                    )}
                  >
                    {a.label}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Results */}
        {results.length === 0 ? (
          <div className="flex flex-col items-start justify-center rounded-2xl border border-dashed border-stone p-12">
            <p className="font-display text-xl text-ink">No farms match yet.</p>
            <p className="mt-2 text-ink-soft">Loosen a filter and the land opens up.</p>
            <button onClick={clearAll} className="mt-4 text-sm text-field hover:underline" type="button">Clear filters</button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {results.map((host) => (
              <Link
                key={host.id}
                to={`/hosts/${host.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-stone bg-surface transition-colors hover:border-field/50"
              >
                <div className="overflow-hidden">
                  <img
                    src={host.photos[0]}
                    alt={host.farmName}
                    loading="lazy"
                    className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-lg leading-snug text-ink">{host.farmName}</h2>
                  <div className="text-xs uppercase tracking-wider text-ink-soft">
                    {host.region}, {host.country}
                  </div>
                  <div className="mt-2">
                    <Stars rating={host.rating} count={host.reviewCount} />
                  </div>
                  <p className="mt-3 text-sm text-ink-soft">{host.helpSummary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {host.farmTypes.slice(0, 1).map((t) => (
                      <Tag key={t}>{farmTypeLabel(t)}</Tag>
                    ))}
                    {host.activities.slice(0, 3).map((a) => (
                      <Tag key={a}>{activityLabel(a)}</Tag>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-stone/60 pt-3 text-xs text-ink-soft">
                    {host.season} · from {host.minStayDays} days
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
