import { Link } from 'react-router-dom'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { buttonClass } from '@/components/ui/Button'

const EXPLORER_STEPS = [
  { n: '01', title: 'Build your profile', body: 'Tell hosts who you are, what you can do, and when you’re free. A photo is required — it’s how trust starts.' },
  { n: '02', title: 'Find a farm', body: 'Browse by country, farm type and the work you want to do. Save the ones you like.' },
  { n: '03', title: 'Apply & agree', body: 'Send a short application. The host replies, and you settle dates and details together.' },
  { n: '04', title: 'Stay & work', body: 'Trade a few hours of help a day for a bed and meals. Leave a review when you go.' },
]

const HOST_STEPS = [
  { n: '01', title: 'List your farm', body: 'Describe your place, your accommodation and meals, and the languages you speak. Hosting is free.' },
  { n: '02', title: 'Post what you need', body: 'Publish stays with the activities, season and how many Explorers you can take.' },
  { n: '03', title: 'Choose your Explorers', body: 'Read applications, message, and accept the people who fit.' },
  { n: '04', title: 'Share the work', body: 'Welcome them, share the season, and leave a review afterwards.' },
]

function Steps({ steps }: { steps: { n: string; title: string; body: string }[] }) {
  return (
    <div className="mt-6 grid gap-8 sm:grid-cols-2">
      {steps.map((s) => (
        <div key={s.n}>
          <div className="font-display text-2xl text-harvest">{s.n}</div>
          <h3 className="mt-2 font-display text-xl text-ink">{s.title}</h3>
          <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
        </div>
      ))}
    </div>
  )
}

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <Eyebrow>How it works</Eyebrow>
      <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ink">
        A fair exchange: your help for a home on the land.
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Farm &amp; Travel is not a jobs board and not a booking site. Explorers give a few hours of
        work a day; hosts give a bed, meals and a place in their world. No money changes hands
        between people — membership is the only thing we charge for.
      </p>

      <section className="mt-14">
        <h2 className="font-display text-2xl text-ink">For Explorers</h2>
        <Steps steps={EXPLORER_STEPS} />
      </section>

      <section className="mt-14 rounded-3xl border border-stone bg-surface p-8">
        <h2 className="font-display text-2xl text-ink">For hosts</h2>
        <Steps steps={HOST_STEPS} />
      </section>

      <section className="mt-14 flex flex-col items-start gap-4 rounded-3xl bg-field px-8 py-10 text-paper sm:flex-row sm:items-center sm:justify-between">
        <h2 className="max-w-md font-display text-2xl leading-tight">Ready to find your season?</h2>
        <div className="flex gap-3">
          <Link to="/hosts" className={buttonClass('primary', 'bg-paper text-field hover:bg-harvest-soft')}>
            Browse hosts
          </Link>
          <Link to="/pricing" className={buttonClass('outline', 'border-paper/40 text-paper hover:border-paper hover:bg-paper/10')}>
            See membership
          </Link>
        </div>
      </section>
    </div>
  )
}
