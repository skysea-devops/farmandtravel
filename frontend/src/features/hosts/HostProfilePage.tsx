import { Link, useParams } from 'react-router-dom'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Tag } from '@/components/ui/Tag'
import { Stars } from '@/components/ui/Stars'
import { buttonClass } from '@/components/ui/Button'
import { getHost, reviewsByHost } from '@/data/mock'
import { activityLabel, farmTypeLabel } from '@/config/taxonomy'
import { NotFoundPage } from '@/features/misc/NotFoundPage'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone bg-surface px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-0.5 text-ink">{value}</div>
    </div>
  )
}

export function HostProfilePage() {
  const { id } = useParams()
  const host = id ? getHost(id) : undefined
  if (!host) return <NotFoundPage />

  const reviews = reviewsByHost(host.id)
  const d = 0.04
  const bbox = `${host.lng - d},${host.lat - d},${host.lng + d},${host.lat + d}`
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${host.lat},${host.lng}`
  const mapLink = `https://www.openstreetmap.org/?mlat=${host.lat}&mlon=${host.lng}#map=12/${host.lat}/${host.lng}`

  return (
    <div className="mx-auto max-w-5xl px-5 pt-10">
      <Link to="/hosts" className="text-sm text-field hover:underline">
        ← All hosts
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl border border-stone">
        <img src={host.photos[0]} alt={host.farmName} className="aspect-[16/7] w-full object-cover" />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-soft">
            {host.region}, {host.country} · hosting since {host.joined}
          </div>
          <h1 className="mt-2 font-display text-4xl text-ink">{host.farmName}</h1>
          <p className="mt-2 text-ink-soft">Hosted by {host.hostName}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {host.farmTypes.map((t) => (
              <Tag key={t}>{farmTypeLabel(t)}</Tag>
            ))}
            {host.activities.map((a) => (
              <Tag key={a}>{activityLabel(a)}</Tag>
            ))}
          </div>

          <p className="mt-6 leading-relaxed text-ink-soft">{host.description}</p>

          {/* Help facts */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact label="Season" value={host.season} />
            <Fact label="Min stay" value={`${host.minStayDays} days`} />
            <Fact label="Help / day" value={`~${host.hoursPerDay} hrs`} />
            <Fact label="Spots" value={String(host.spots)} />
          </div>

          <div className="mt-8">
            <Eyebrow>What you’ll do</Eyebrow>
            <p className="mt-3 leading-relaxed text-ink-soft">{host.helpDescription}</p>
          </div>

          <div className="mt-8">
            <Eyebrow>Good if you are</Eyebrow>
            <ul className="mt-3 space-y-1.5 text-ink-soft">
              {host.skillsWanted.map((s) => (
                <li key={s} className="flex gap-2">
                  <span aria-hidden className="text-field">·</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Stay & meals */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone bg-surface px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-ink-soft">Stay</div>
              <div className="mt-0.5 text-sm text-ink">{host.accommodation}</div>
            </div>
            <div className="rounded-xl border border-stone bg-surface px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-ink-soft">Meals</div>
              <div className="mt-0.5 text-sm text-ink">{host.meals}</div>
            </div>
            <div className="rounded-xl border border-stone bg-surface px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-ink-soft">Languages</div>
              <div className="mt-0.5 text-sm text-ink">{host.languages.join(', ')}</div>
            </div>
          </div>

          {/* Photos */}
          <section className="mt-12">
            <Eyebrow>Photos</Eyebrow>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {host.photos.map((p, i) => (
                <img
                  key={p}
                  src={p}
                  alt={`${host.farmName} — photo ${i + 1}`}
                  loading="lazy"
                  className="aspect-[3/2] w-full rounded-xl border border-stone object-cover"
                />
              ))}
            </div>
          </section>

          {/* Map */}
          <section className="mt-12">
            <Eyebrow>Where you’ll be</Eyebrow>
            <p className="mt-2 text-sm text-ink-soft">
              Around {host.region}. The pin shows the general area — the exact address is shared once
              a stay is agreed.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-stone">
              <iframe
                title={`Map showing ${host.region}`}
                src={mapSrc}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a href={mapLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-field hover:underline">
              Open in OpenStreetMap →
            </a>
          </section>

          {/* Reviews */}
          <section className="mt-12">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Eyebrow>Reviews</Eyebrow>
              <Stars rating={host.rating} count={host.reviewCount} />
            </div>
            <p className="mt-2 text-xs text-stone">
              Sample reviews for now — real feedback appears here once Explorers complete a stay booked
              through Farm &amp; Travel.
            </p>
            {reviews.length === 0 ? (
              <p className="mt-5 text-ink-soft">No reviews yet.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-stone bg-surface p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-field/10 font-display text-field">
                          {r.author.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-ink">{r.author}</div>
                          <div className="text-xs text-ink-soft">{r.country} · {r.date}</div>
                        </div>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="mt-3 text-ink-soft">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sticky sidebar box */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-2xl border border-stone bg-surface p-5">
            <div className="font-display text-xl text-ink">{host.farmName}</div>
            <div className="mt-2">
              <Stars rating={host.rating} count={host.reviewCount} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">Hosted by {host.hostName}</p>

            <div className="mt-4 space-y-1.5 text-sm text-ink-soft">
              <div className="flex justify-between"><span className="text-stone">Season</span><span className="text-ink">{host.season}</span></div>
              <div className="flex justify-between"><span className="text-stone">Min stay</span><span className="text-ink">{host.minStayDays} days</span></div>
              <div className="flex justify-between"><span className="text-stone">Spots</span><span className="text-ink">{host.spots}</span></div>
            </div>

            <div className="mt-5 border-t border-stone/60 pt-5">
              <Link to="/pricing" className={buttonClass('primary', 'w-full')}>
                Apply to stay
              </Link>
              <p className="mt-2 text-center text-xs text-ink-soft">
                Applying needs an Explorer membership.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
