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
    date: "Bu hafta",
    author: "Özgür",
    place: "Kurucu üye",
    youtubeId: "jOW8K7XUX4o",
  },
  {
    id: "meeting-monthly",
    kind: "meeting",
    title: "Aylık topluluk buluşması (online)",
    desc: "Deneyim paylaşımı, yeni üyelerle tanışma ve soru-cevap. Herkes davetli.",
    date: "3 gün önce",
    when: "5 Ekim, 20:00 · Zoom",
    online: true,
  },
  {
    id: "photo-harvest",
    kind: "photo",
    title: "Hasat günü",
    desc: "Konya'daki çiftlikte gönüllülerle birlikte güzel bir hasat tamamladık. Emeği geçen herkese teşekkürler!",
    date: "5 gün önce",
    author: "Deniz",
    place: "🇹🇷 Konya",
    image: U + "photo-1500382017468-9049fed747ef" + q,
  },
  {
    id: "announce-aegean",
    kind: "announcement",
    title: "Yeni bölge: Ege'de 12 yeni çiftlik",
    desc: "Topluluğumuz büyüyor — İzmir, Muğla ve çevresinde 12 yeni çiftlik aramıza katıldı.",
    date: "1 hafta önce",
  },
  {
    id: "photo-planting",
    kind: "photo",
    title: "Fidan dikimi",
    desc: "Berlin çevresindeki ağaçlandırma projesinde bir günde 300 fidan diktik.",
    date: "1 hafta önce",
    author: "Jonas",
    place: "🇩🇪 Berlin",
    image: U + "photo-1441974231531-c6227db76b6e" + q,
  },
  {
    id: "meeting-permaculture",
    kind: "meeting",
    title: "Permakültür atölyesi (yüz yüze)",
    desc: "Sintra'daki çiftlikte uygulamalı permakültür atölyesi. Katılım sınırlı.",
    date: "1 hafta önce",
    when: "12 Ekim, 10:00 · Sintra",
    online: false,
  },
];

export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
