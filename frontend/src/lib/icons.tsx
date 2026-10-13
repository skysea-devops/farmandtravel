// Tek bir çizgi-ikon seti (lucide). Emoji yerine tutarlı, monokrom ikonlar —
// profil ve çiftlik rehberi görünümlerinde kullanılır. Alan anahtarları
// data/host.ts ve onboarding taksonomisiyle birebir eşleşir.
import type { LucideIcon } from "lucide-react";
import {
  Sprout, Shovel, Wheat, PawPrint, ChefHat, House, Wrench, Hammer, Palette, Globe,
  BedSingle, BedDouble, Tent, CookingPot, Bath, Droplets, WashingMachine, Wifi, Bike, Bus, Dog,
  Salad, Leaf, Beef,
  ShoppingBasket, Waypoints, Waves, Footprints, MapPin,
  Sparkles, Trash2, Wine, CigaretteOff, Moon, Shirt, Utensils,
  Mountain,
} from "lucide-react";

export const HELP_ICONS: Record<string, LucideIcon> = {
  gardening: Sprout, planting: Shovel, harvest: Wheat, animals: PawPrint, cooking: ChefHat,
  housework: House, maintenance: Wrench, building: Hammer, crafts: Palette, ecoprojects: Globe,
};

export const AMENITY_ICONS: Record<string, LucideIcon> = {
  private_room: BedSingle, shared_room: BedDouble, camping: Tent, shared_kitchen: CookingPot,
  bathroom: Bath, toilet: Droplets, laundry: WashingMachine, wifi: Wifi, pets: Dog, bike: Bike, transport: Bus,
};

export const MEAL_ICONS: Record<string, LucideIcon> = { vegetarian: Salad, vegan: Leaf, omnivore: Beef };

export const AROUND_ICONS: Record<string, LucideIcon> = {
  market: ShoppingBasket, transport: Bus, trips: Waypoints, swimming: Waves, nature: Footprints, sightseeing: MapPin,
};

export const RULE_ICONS: Record<string, LucideIcon> = {
  clean: Sparkles, trash: Trash2, laundry: WashingMachine, weekly_clean: Sparkles, food: Utensils,
  animals: PawPrint, alcohol: Wine, smoking: CigaretteOff, quiet: Moon, visitors: Footprints, work_clothes: Shirt,
};

export const PHOTO_ICONS: Record<string, LucideIcon> = {
  farm_overview: Mountain, sleeping: BedDouble, building: House, kitchen: CookingPot, toilet: Droplets, bathroom: Bath,
};

// Alan anahtarından ikon render eden yardımcı. Bulunamazsa hiçbir şey çizmez.
export function DomainIcon({ map, k, size = 18, strokeWidth = 1.75, className }: {
  map: Record<string, LucideIcon>; k: string; size?: number; strokeWidth?: number; className?: string;
}) {
  const C = map[k];
  return C ? <C size={size} strokeWidth={strokeWidth} className={className} /> : null;
}
