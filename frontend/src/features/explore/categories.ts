// Harita kategori renkleri — hem MembersMap (leaflet, lazy) hem ExplorePage
// kullanır. Leaflet'i ana bundle'a çekmemek için renkler burada ayrı tutulur.
export type MapCategory = "host_active" | "host_idle" | "volunteer" | "other";

// 4 renk: gönüllü arayan yer sahibi (yeşil), yer sahibi-aramıyor (altın),
// gönüllü (turuncu), öğrenen/destekçi (gri).
export const MAP_COLORS: Record<MapCategory, string> = {
  host_active: "#3a7d44",
  host_idle: "#dca72c",
  volunteer: "#e0772f",
  other: "#b7b3a6",
};
