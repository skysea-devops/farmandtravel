// Static geocoding for map pins. Members store free-text country/city; we resolve
// them to coordinates client-side (no external geocoder). Unknown city -> country
// centroid; unknown country -> null (not pinned). A small deterministic jitter keeps
// multiple pins in the same place from stacking exactly on top of each other.

type LatLng = [number, number];

const norm = (s: string | null | undefined) => (s ?? "").toLocaleLowerCase("tr").trim();

// All 81 Turkish provinces + common European cities used by the community.
const CITY: Record<string, LatLng> = {
  // Türkiye (il merkezleri)
  adana: [37.0, 35.32], adıyaman: [37.76, 38.28], afyonkarahisar: [38.76, 30.54], ağrı: [39.72, 43.05],
  amasya: [40.65, 35.83], ankara: [39.93, 32.86], antalya: [36.9, 30.7], artvin: [41.18, 41.82],
  aydın: [37.85, 27.84], balıkesir: [39.65, 27.88], bilecik: [40.14, 29.98], bingöl: [38.88, 40.5],
  bitlis: [38.4, 42.11], bolu: [40.58, 31.58], burdur: [37.72, 30.29], bursa: [40.19, 29.06],
  çanakkale: [40.16, 26.41], çankırı: [40.6, 33.62], çorum: [40.55, 34.95], denizli: [37.78, 29.09],
  diyarbakır: [37.91, 40.24], edirne: [41.68, 26.56], elazığ: [38.68, 39.22], erzincan: [39.75, 39.49],
  erzurum: [39.9, 41.27], eskişehir: [39.78, 30.52], gaziantep: [37.07, 37.38], giresun: [40.91, 38.39],
  gümüşhane: [40.46, 39.48], hakkari: [37.58, 43.74], hatay: [36.2, 36.16], ısparta: [37.76, 30.55],
  isparta: [37.76, 30.55], mersin: [36.81, 34.64], istanbul: [41.01, 28.98], "i̇stanbul": [41.01, 28.98],
  izmir: [38.42, 27.14], "i̇zmir": [38.42, 27.14], kars: [40.6, 43.1], kastamonu: [41.39, 33.78],
  kayseri: [38.73, 35.49], kırklareli: [41.74, 27.22], kırşehir: [39.15, 34.16], kocaeli: [40.77, 29.92],
  konya: [37.87, 32.48], kütahya: [39.42, 29.98], malatya: [38.36, 38.31], manisa: [38.62, 27.43],
  kahramanmaraş: [37.58, 36.93], mardin: [37.31, 40.74], muğla: [37.22, 28.36], muş: [38.73, 41.49],
  nevşehir: [38.62, 34.71], niğde: [37.97, 34.68], ordu: [40.98, 37.88], rize: [41.02, 40.52],
  sakarya: [40.78, 30.4], samsun: [41.29, 36.33], siirt: [37.93, 41.94], sinop: [42.03, 35.15],
  sivas: [39.75, 37.02], tekirdağ: [40.98, 27.51], tokat: [40.31, 36.55], trabzon: [41.0, 39.72],
  tunceli: [39.11, 39.55], şanlıurfa: [37.17, 38.79], uşak: [38.68, 29.41], van: [38.49, 43.41],
  yozgat: [39.82, 34.81], zonguldak: [41.45, 31.79], aksaray: [38.37, 34.03], bayburt: [40.26, 40.22],
  karaman: [37.18, 33.22], kırıkkale: [39.85, 33.51], batman: [37.88, 41.13], şırnak: [37.52, 42.46],
  bartın: [41.64, 32.34], ardahan: [41.11, 42.7], ığdır: [39.92, 44.04], yalova: [40.65, 29.28],
  karabük: [41.2, 32.62], kilis: [36.72, 37.12], osmaniye: [37.07, 36.25], düzce: [40.84, 31.16],
  // Avrupa (yaygın şehirler)
  sintra: [38.8, -9.38], lizbon: [38.72, -9.14], lisbon: [38.72, -9.14], porto: [41.15, -8.61],
  berlin: [52.52, 13.4], münih: [48.14, 11.58], munih: [48.14, 11.58], hamburg: [53.55, 9.99],
  valensiya: [39.47, -0.38], valencia: [39.47, -0.38], madrid: [40.42, -3.7], barselona: [41.39, 2.17],
  barcelona: [41.39, 2.17], torino: [45.07, 7.69], roma: [41.9, 12.5], milano: [45.46, 9.19],
  utrecht: [52.09, 5.12], amsterdam: [52.37, 4.9], paris: [48.86, 2.35], atina: [37.98, 23.73],
  viyana: [48.21, 16.37], londra: [51.51, -0.13], london: [51.51, -0.13],
};

const COUNTRY: Record<string, LatLng> = {
  türkiye: [39.0, 35.0], turkiye: [39.0, 35.0], turkey: [39.0, 35.0],
  portekiz: [39.5, -8.0], portugal: [39.5, -8.0],
  almanya: [51.0, 10.0], germany: [51.0, 10.0],
  ispanya: [40.0, -3.7], "i̇spanya": [40.0, -3.7], spain: [40.0, -3.7],
  italya: [42.8, 12.8], "i̇talya": [42.8, 12.8], italy: [42.8, 12.8],
  hollanda: [52.2, 5.3], netherlands: [52.2, 5.3],
  yunanistan: [39.0, 22.0], greece: [39.0, 22.0],
  fransa: [46.6, 2.2], france: [46.6, 2.2],
  avusturya: [47.6, 14.1], austria: [47.6, 14.1],
  "i̇ngiltere": [52.5, -1.5], ingiltere: [52.5, -1.5], "birleşik krallık": [52.5, -1.5], uk: [52.5, -1.5],
};

// Small deterministic offset from an id so co-located pins don't overlap exactly.
function jitter(seed: string, amp: number): LatLng {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const a = ((h & 0xffff) / 0xffff - 0.5) * 2;
  const b = (((h >> 16) & 0xffff) / 0xffff - 0.5) * 2;
  return [a * amp, b * amp];
}

// Find a known city/province inside a free-text location. Users often type an il +
// ilçe ("Manisa Kırkağaç") or add separators ("Kırkağaç / Manisa"); the full string
// won't be a key, so after an exact miss we scan each word for a known province/city.
function cityLookup(city: string | null): LatLng | undefined {
  const nc = norm(city);
  if (!nc) return undefined;
  const exact = CITY[nc];
  if (exact) return exact;
  // Split on whitespace/punctuation only (not letters) so "İstanbul" stays intact.
  for (const tok of nc.split(/[\s,/;.\-|]+/)) {
    if (tok && CITY[tok]) return CITY[tok];
  }
  return undefined;
}

// Resolve a member to [lat, lng], or null when we can't place them at all.
export function coordsFor(country: string | null, city: string | null, seed = ""): LatLng | null {
  const cityHit = cityLookup(city);
  if (cityHit) {
    const [dy, dx] = jitter(seed, 0.06); // tiny spread within a city
    return [cityHit[0] + dy, cityHit[1] + dx];
  }
  const countryHit = COUNTRY[norm(country)];
  if (countryHit) {
    const [dy, dx] = jitter(seed, 0.8); // wider spread across a country
    return [countryHit[0] + dy, countryHit[1] + dx];
  }
  return null;
}
