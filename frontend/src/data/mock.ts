import type { Host, Project, Review, SupporterPreview } from '@/types/domain'

// Placeholder content so Phase A pages are alive before the API exists.
// Swap for apiFetch() in Sprint 2. Images are in /public/img.
// One host = one profile carrying the farm + the help they want.

export const HOSTS: Host[] = [
  // Real host: Ozgur's Farm near Gelenbe, Kırkağaç / Manisa.
  // Description rewritten in the farm's own voice; photos supplied by the farm.
  // (The stone-guesthouse build is a "project seeking support" — that belongs to
  //  the future Projects section, not here.)
  {
    id: 'host_gelenbe',
    farmName: "Ozgur's Farm",
    hostName: 'Özgür',
    country: 'Türkiye',
    region: 'Kırkağaç, Manisa',
    lat: 39.19,
    lng: 27.65,
    farmTypes: ['organic_farm', 'animal_care', 'vineyard_orchard'],
    languages: ['Turkish', 'English'],
    description:
      'A family organic farm in the Aegean hills above Gelenbe, run by Özgür with his parents. We grow without chemicals — walnuts, olives, figs, peaches, plums and apples, and beds of peppers, beans, tomatoes and melons — and keep goats, a cow, chickens and a lot of cats. We press oil, make our own yogurt and goat cheese, and turn the harvest into preserves, pickles and dried fruit. At around 500 metres the nights stay cool even in August. Days start early and are worked side by side; meals are long, fresh from the garden, and shared with the family. Two days off a week — close to Bergama, Ayvalık, Dikili and the coast.',
    activities: ['harvest', 'planting', 'gardening', 'animal_care'],
    helpSummary: 'Plant, hoe, weed and harvest with the family, and help care for the goats.',
    helpDescription:
      'The heart of the farm is the growing season. Depending on the month you’ll plant, hoe, weed and harvest — walnuts, beans, tomatoes, figs, melons — and help feed and move the goats. Özgür teaches as you work: which plant is which, why we do it this way, and how to grow clean food that’s good for the soil and for people. Physical, satisfying days, with a long lunch and a rest through the heat, and time to learn bread, cheese, yogurt and preserving in the kitchen.',
    skillsWanted: ['Happy with early starts and physical work', 'Curious about organic growing'],
    season: 'Apr – Nov',
    minStayDays: 14,
    hoursPerDay: 5,
    spots: 2,
    accommodation: 'A volunteer room with simple beds (fits up to four); tents welcome. Shared kitchen, bathroom and washing machine.',
    meals: 'Breakfast, lunch, dinner and tea — mostly vegetable dishes, almost all from the farm.',
    photos: ['/img/ozgur-5.jpg', '/img/ozgur-2.jpg', '/img/ozgur-4.jpg', '/img/ozgur-3.jpg', '/img/ozgur-1.jpg'],
    joined: '2023',
    rating: 4.9,
    reviewCount: 25,
  },
  {
    id: 'host_kaya',
    farmName: 'Kaya Grove',
    hostName: 'Elif',
    country: 'Türkiye',
    region: 'Ayvalık',
    lat: 39.31,
    lng: 26.69,
    farmTypes: ['organic_farm', 'vineyard_orchard'],
    languages: ['Turkish', 'English'],
    description:
      'A family olive grove above the Aegean. We farm without chemicals, press our own oil, and keep the old stone terraces alive by hand. Days are early and unhurried; evenings are long dinners under the fig tree.',
    activities: ['harvest', 'cooking', 'maintenance'],
    helpSummary: 'Pick olives by hand, press oil, and help keep the grove in shape.',
    helpDescription:
      'October and November are harvest — you’ll pick with us and help at the press. Outside harvest it’s pruning, mulching and getting the grove ready for the next season. No experience needed, just willing hands and an early alarm.',
    skillsWanted: ['Willing to start early', 'Comfortable outdoors'],
    season: 'Oct – Nov',
    minStayDays: 10,
    hoursPerDay: 5,
    spots: 2,
    accommodation: 'Private room in a restored stone house',
    meals: 'Three meals a day, mostly from the garden',
    photos: ['/img/village1.jpg', '/img/farmworker1.jpg'],
    joined: '2024',
    rating: 4.8,
    reviewCount: 12,
  },
  {
    id: 'host_alpe',
    farmName: 'Alpe Verde',
    hostName: 'Marco',
    country: 'Italy',
    region: 'Piedmont',
    lat: 44.70,
    lng: 7.90,
    farmTypes: ['dairy', 'animal_care'],
    languages: ['Italian', 'English', 'French'],
    description:
      'A small mountain dairy. Mornings start with the cows; afternoons are for cheese, fences and hay. If you want to learn where real cheese comes from, this is it.',
    activities: ['milking', 'animal_care', 'fencing'],
    helpSummary: 'Milk the herd at first light, then help turn the milk into cheese.',
    helpDescription:
      'You’ll learn the full rhythm of a mountain dairy: milking, the cheese room, and keeping the animals and fences in order. Early mornings, real skills, and mountain views the whole way.',
    skillsWanted: ['Early riser', 'Fine around large animals'],
    season: 'May – Sep',
    minStayDays: 14,
    hoursPerDay: 5,
    spots: 1,
    accommodation: 'Shared cabin, wood stove',
    meals: 'Breakfast and dinner together',
    photos: ['/img/village3.jpg', '/img/farmworker2.jpg'],
    joined: '2025',
    rating: 4.9,
    reviewCount: 18,
  },
  {
    id: 'host_duna',
    farmName: 'Duna Permakültür',
    hostName: 'Anna',
    country: 'Hungary',
    region: 'Danube Bend',
    lat: 47.79,
    lng: 18.86,
    farmTypes: ['permaculture', 'homestead'],
    languages: ['Hungarian', 'English', 'German'],
    description:
      'A young food forest on the Danube. We design guilds, save seed, and build with what the land gives. Come for the plants, stay for the community kitchen.',
    activities: ['planting', 'composting', 'seed_saving', 'gardening'],
    helpSummary: 'Plant guilds, save seed, and help shape a young food forest.',
    helpDescription:
      'Hands-on permaculture: planting, composting, mulching and saving seed for next year. We teach as we go, and cook everything together at night.',
    skillsWanted: ['Curiosity about plants'],
    season: 'Apr – Oct',
    minStayDays: 7,
    hoursPerDay: 5,
    spots: 4,
    accommodation: 'Tiny house or bell tent',
    meals: 'Vegetarian, cooked together with the group',
    photos: ['/img/farmworker3.jpg', '/img/village3.jpg'],
    joined: '2024',
    rating: 4.7,
    reviewCount: 9,
  },
  {
    id: 'host_rewild',
    farmName: 'Rewild Refuge',
    hostName: 'Tomás',
    country: 'Portugal',
    region: 'Alentejo',
    lat: 38.02,
    lng: -7.87,
    farmTypes: ['animal_care', 'regenerative'],
    languages: ['Portuguese', 'English'],
    description:
      'A rescue and rewilding project on the plains. Rescued donkeys, goats and a lot of tree planting. Hard, rewarding work with people who care.',
    activities: ['animal_care', 'planting', 'fencing'],
    helpSummary: 'Care for rescued animals and plant trees for the rewilding.',
    helpDescription:
      'Mornings with the animals — feeding, cleaning, enclosure care — and cooler hours for planting native trees. Steady, meaningful work on the Alentejo plains.',
    skillsWanted: ['Love for animals', 'Resilient in heat'],
    season: 'Year-round',
    minStayDays: 14,
    hoursPerDay: 5,
    spots: 3,
    accommodation: 'Bunkhouse',
    meals: 'Three meals a day',
    photos: ['/img/farmworker1.jpg', '/img/village2.jpg'],
    joined: '2023',
    rating: 4.8,
    reviewCount: 14,
  },
]

// Sample placeholder reviews (written for the scaffold — NOT real feedback).
export const REVIEWS: Review[] = [
  { id: 'rev_g1', hostId: 'host_gelenbe', author: 'Sofia', country: 'Portugal', date: 'Jun 2026', rating: 5, text: 'Early mornings in the field, long lunches in the shade, and a family who make you feel at home from day one. I left with real skills and a full heart.' },
  { id: 'rev_g2', hostId: 'host_gelenbe', author: 'Daniel', country: 'Canada', date: 'May 2026', rating: 5, text: 'Proper hands-on farming. You work hard, but you learn a huge amount — and eat some of the best food I’ve ever had.' },
  { id: 'rev_g3', hostId: 'host_gelenbe', author: 'Yuki', country: 'Japan', date: 'Sep 2025', rating: 4, text: 'A peaceful, beautiful place. Hot in high summer so bring a hat — everything else was wonderful.' },
  { id: 'rev_k1', hostId: 'host_kaya', author: 'Marta', country: 'Spain', date: 'Nov 2025', rating: 5, text: 'Harvest season on the grove was magic. Hard work, great oil, kind people.' },
  { id: 'rev_a1', hostId: 'host_alpe', author: 'Lukas', country: 'Germany', date: 'Aug 2025', rating: 5, text: 'Learned to make cheese from scratch. The mountain mornings alone were worth it.' },
  { id: 'rev_d1', hostId: 'host_duna', author: 'Emma', country: 'Netherlands', date: 'Jul 2025', rating: 5, text: 'A warm little community and so much to learn about permaculture. Cooking together every night was the best part.' },
]

// --- Selectors ---------------------------------------------------------------
export function getHost(id: string): Host | undefined {
  return HOSTS.find((h) => h.id === id)
}
export function reviewsByHost(hostId: string): Review[] {
  return REVIEWS.filter((r) => r.hostId === hostId)
}

// --- Parked (Module 2) --------------------------------------------------------
export const MOCK_PROJECTS: Project[] = [
  { id: 'prj_1', name: 'Meadow Return', founderFirstName: 'Lena', country: 'Germany', stage: 'building', summary: 'Turning tired cropland back into wildflower meadow and silvopasture.', needs: ['Agroforestry mentor', 'Grant writing', 'Volunteers'] },
  { id: 'prj_2', name: 'Kıyı Food Forest', founderFirstName: 'Deniz', country: 'Türkiye', stage: 'early', summary: 'A public food forest on the coast, planted with the neighbourhood.', needs: ['Permaculture design', 'Legal / land use', 'Partnership'] },
]
export const MOCK_SUPPORTERS: SupporterPreview[] = [
  { id: 'sup_1', firstName: 'Amara', country: 'Kenya', expertise: ['Regenerative grazing', 'Soil science'] },
  { id: 'sup_2', firstName: 'Jonas', country: 'Sweden', expertise: ['Timber building', 'Off-grid energy'] },
]
