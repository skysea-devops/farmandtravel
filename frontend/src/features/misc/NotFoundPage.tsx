import { Link } from 'react-router-dom'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { buttonClass } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start px-5 pt-24">
      <Eyebrow>Off the map</Eyebrow>
      <h1 className="mt-4 font-display text-5xl text-ink">This plot is fallow.</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        There's nothing growing at this address. Head back and pick a path.
      </p>
      <Link to="/" className={buttonClass('primary', 'mt-8')}>
        Back home
      </Link>
    </div>
  )
}
