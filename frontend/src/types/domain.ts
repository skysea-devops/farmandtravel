// Core domain types for Module 1 (Hosts). Farm/village focused.
// One host = one profile that carries both the place AND the help they want.
// (No enums — tsconfig runs erasableSyntaxOnly; string unions instead.)

export type MembershipId =
  | 'experience_explorer'
  | 'experience_host'
  | 'project_creator'
  | 'supporter'

export type ModuleId = 'experiences' | 'projects'

export type Money = {
  amount: number
  currency: 'EUR'
  interval: 'year' | 'month' | 'free'
}

export type FarmTypeId =
  | 'organic_farm'
  | 'permaculture'
  | 'homestead'
  | 'animal_care'
  | 'vineyard_orchard'
  | 'eco_village'
  | 'dairy'
  | 'beekeeping'
  | 'regenerative'

export type ActivityId =
  | 'harvest'
  | 'planting'
  | 'animal_care'
  | 'milking'
  | 'building'
  | 'fencing'
  | 'cooking'
  | 'gardening'
  | 'composting'
  | 'seed_saving'
  | 'maintenance'

export type Host = {
  id: string
  farmName: string
  hostName: string
  country: string
  region: string
  lat: number
  lng: number
  farmTypes: FarmTypeId[]
  languages: string[]
  description: string // about the farm

  // The help this host is looking for (folded in — no separate listing).
  activities: ActivityId[]
  helpSummary: string // one line
  helpDescription: string // what you'll do
  skillsWanted: string[]
  season: string
  minStayDays: number
  hoursPerDay: number
  spots: number

  accommodation: string
  meals: string
  photos: string[] // public paths, e.g. /img/village1.jpg
  joined: string // year
  rating: number // 0–5 average
  reviewCount: number
}

export type Review = {
  id: string
  hostId: string
  author: string // first name only
  country: string
  date: string // e.g. 'Jun 2026'
  rating: number // 1–5
  text: string
}

// --- Parked (Module 2: Projects + supporters, a separate section) -------------
export type ProjectStage = 'idea' | 'early' | 'building' | 'scaling'

export type Project = {
  id: string
  name: string
  founderFirstName: string
  country: string
  stage: ProjectStage
  summary: string
  needs: string[]
}

export type SupporterPreview = {
  id: string
  firstName: string
  country: string
  expertise: string[]
}
