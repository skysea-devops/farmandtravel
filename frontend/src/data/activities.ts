// Topluluk aktivite akışı — Aktiviteler sayfası ve ana sayfadaki "son aktiviteler" bunu kullanır.
// (Şimdilik mock; ileride backend'den bir feed olarak gelecek.)
export type ActivityKind = "video" | "photo" | "meeting" | "announcement";

export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string;
  desc: string;
  date: string;            // görünen tarih
  author?: string;         // paylaşan
  place?: string;          // yer / rol
  youtubeId?: string;      // kind === "video"
  image?: string;          // kind === "photo" | fallback görsel
  when?: string;           // kind === "meeting" — tarih/saat
  online?: boolean;        // kind === "meeting"
}

const U = "https://images.unsplash.com/";
const q = "?w=800&q=80";

export const ACTIVITIES: Activity[] = [
  {
    id: "podcast-ozgur",
    kind: "video",
    title: "Toprakla Yeniden'in hikâyesi — Özgür ile",
    desc: "Topluluk fikrinin sahibi ve kurucu üyemiz Özgür, Toprakla Yeniden'in nasıl doğduğunu ve nereye gittiğini anlatıyor.",
    date: "22 Eylül",
    author: "Özgür",
    place: "Kurucu üye",
    youtubeId: "jOW8K7XUX4o",
  },
  {
    id: "meeting-monthly",
    kind: "meeting",
    title: "Topluluk buluşması",
    desc: "Deneyim paylaşımı, yeni üyelerle tanışma ve soru-cevap. Herkes davetli.",
    date: "20 Eylül",
    when: "18 Eylül, 20:00 · Zoom",
    online: true,
  },
  {
    id: "photo-harvest",
    kind: "photo",
    title: "Hasat günü",
    desc: "Konya'daki çiftlikte gönüllülerle birlikte güzel bir hasat tamamladık. Emeği geçen herkese teşekkürler!",
    date: "16 Eylül",
    author: "Deniz",
    place: "🇹🇷 Konya",
    image: U + "photo-1500382017468-9049fed747ef" + q,
  },
  {
    id: "photo-planting",
    kind: "photo",
    title: "Fidan dikimi",
    desc: "Berlin çevresindeki ağaçlandırma projesinde bir günde 300 fidan diktik.",
    date: "10 Eylül",
    author: "Jonas",
    place: "🇩🇪 Berlin",
    image: U + "photo-1441974231531-c6227db76b6e" + q,
  },
  {
    id: "meeting-permaculture",
    kind: "meeting",
    title: "Permakültür atölyesi (yüz yüze)",
    desc: "Sintra'daki çiftlikte uygulamalı permakültür atölyesi. Katılım sınırlı.",
    date: "8 Eylül",
    when: "6 Eylül, 10:00 · Sintra",
    online: false,
  },
];

export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
