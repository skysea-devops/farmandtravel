import { Eyebrow } from '@/components/ui/Eyebrow'
import { Tag } from '@/components/ui/Tag'
import { Card } from '@/components/ui/Card'
import { MOCK_PROJECTS, MOCK_SUPPORTERS } from '@/data/mock'

export function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-14">
      <Eyebrow>Lend your skills</Eyebrow>
      <h1 className="mt-4 font-display text-4xl text-ink">Projects</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Creators post what they need; supporters reach out. Contact stays private until both sides
        accept — the privacy model is enforced server-side in Sprint 3.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {MOCK_PROJECTS.map((p) => (
          <Card key={p.id} className="flex flex-col p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-ink-soft">{p.country}</span>
              <span className="rounded-full bg-field/10 px-2 py-0.5 text-xs text-field">{p.stage}</span>
            </div>
            <h2 className="mt-2 font-display text-xl text-ink">{p.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">by {p.founderFirstName}</p>
            <p className="mt-3 text-sm text-ink-soft">{p.summary}</p>
            <div className="mt-4">
              <div className="mb-1.5 text-xs uppercase tracking-wider text-stone">Needs</div>
              <div className="flex flex-wrap gap-1.5">
                {p.needs.map((n) => (
                  <Tag key={n}>{n}</Tag>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Supporter previews — demonstrates exactly what is visible pre-acceptance */}
      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <div>
            <Eyebrow>Supporters</Eyebrow>
            <h2 className="mt-2 font-display text-2xl text-ink">Who's offering to help</h2>
          </div>
          <span className="text-xs text-stone">Pre-connection view</span>
        </div>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">
          Before a connection is accepted, a supporter shows only first name, country and
          expertise. Surname, city, email, phone and socials never leave the server.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {MOCK_SUPPORTERS.map((s) => (
            <div key={s.id} className="rounded-2xl border border-stone bg-surface p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-field/10 font-display text-field">
                  {s.firstName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-ink">{s.firstName}</div>
                  <div className="text-xs text-ink-soft">{s.country}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.expertise.map((e) => (
                  <Tag key={e}>{e}</Tag>
                ))}
              </div>
              <button
                className="mt-4 w-full rounded-full border border-field/30 px-3 py-2 text-sm text-field hover:bg-field/5"
                type="button"
              >
                Request connection
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
