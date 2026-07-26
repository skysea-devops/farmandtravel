import type { ActivityId, FarmTypeId } from '@/types/domain'

// Farm/village specialisation — deliberately narrower than Workaway's host types.
// Filters and host profiles are built from these lists (single source of truth).

export const FARM_TYPES: { id: FarmTypeId; label: string }[] = [
  { id: 'organic_farm', label: 'Organic farm' },
  { id: 'permaculture', label: 'Permaculture & food forest' },
  { id: 'homestead', label: 'Homestead & smallholding' },
  { id: 'animal_care', label: 'Animal care & rescue' },
  { id: 'vineyard_orchard', label: 'Vineyard & orchard' },
  { id: 'eco_village', label: 'Eco-village & community' },
  { id: 'dairy', label: 'Dairy & cheese' },
  { id: 'beekeeping', label: 'Beekeeping' },
  { id: 'regenerative', label: 'Regenerative & agroforestry' },
]

export const ACTIVITIES: { id: ActivityId; label: string }[] = [
  { id: 'harvest', label: 'Harvest' },
  { id: 'planting', label: 'Planting' },
  { id: 'animal_care', label: 'Animal care' },
  { id: 'milking', label: 'Milking' },
  { id: 'building', label: 'Building & repair' },
  { id: 'fencing', label: 'Fencing' },
  { id: 'cooking', label: 'Cooking & preserving' },
  { id: 'gardening', label: 'Gardening' },
  { id: 'composting', label: 'Composting' },
  { id: 'seed_saving', label: 'Seed saving' },
  { id: 'maintenance', label: 'Maintenance' },
]

export function farmTypeLabel(id: FarmTypeId): string {
  return FARM_TYPES.find((t) => t.id === id)?.label ?? id
}
export function activityLabel(id: ActivityId): string {
  return ACTIVITIES.find((a) => a.id === id)?.label ?? id
}
