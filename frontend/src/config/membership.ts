import type { MembershipId, ModuleId, Money } from '@/types/domain'

export type Membership = {
  id: MembershipId
  name: string
  module: ModuleId
  price: Money
  priceLabel: string
  tagline: string
  highlights: string[]
}

export const MEMBERSHIPS: Membership[] = [
  {
    id: 'experience_explorer',
    name: 'Experience Explorer',
    module: 'experiences',
    price: { amount: 35, currency: 'EUR', interval: 'year' },
    priceLabel: '€35 / year',
    tagline: 'Find a farm and go.',
    highlights: ['Browse & filter hosts', 'Save favourites', 'Apply and message hosts', 'Leave reviews'],
  },
  {
    id: 'experience_host',
    name: 'Experience Host',
    module: 'experiences',
    price: { amount: 0, currency: 'EUR', interval: 'free' },
    priceLabel: 'Free',
    tagline: 'Open your gates.',
    highlights: ['Publish experiences', 'Receive applications', 'Manage applicants', 'Reviews'],
  },
  {
    id: 'project_creator',
    name: 'Project Creator',
    module: 'projects',
    price: { amount: 25, currency: 'EUR', interval: 'month' },
    priceLabel: '€25 / month',
    tagline: 'Ask for what you need.',
    highlights: ['Project profile & gallery', 'Post what you need', 'Receive connection requests', 'Invite supporters'],
  },
  {
    id: 'supporter',
    name: 'Supporter',
    module: 'projects',
    price: { amount: 0, currency: 'EUR', interval: 'free' },
    priceLabel: 'Free',
    tagline: 'Lend your skills.',
    highlights: ['Browse projects', 'Send connection requests', 'Follow & save', 'Stay private until matched'],
  },
]
