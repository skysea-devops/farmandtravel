// Placeholder pages for member-app sections built in later sprints.
function Stub({ title, note }: { title: string; note: string }) {
  return (
    <div>
      <h1 className="font-display mb-4 text-2xl font-semibold">{title}</h1>
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-10 text-center">
        <div className="mb-2 text-3xl">🚧</div>
        <p className="text-sm text-ink-500">{note}</p>
      </div>
    </div>
  );
}

export const KesfetPage = () => <Stub title="Keşfet" note="Üyeleri etiket ve konuma göre keşfetme yakında geliyor." />;
export const BaglantilarPage = () => <Stub title="Bağlantılar" note="Bağlantı istekleri ve kabul akışı yakında geliyor." />;
export const MesajlarPage = () => <Stub title="Mesajlar" note="Bağlantı kurduğun kişilerle mesajlaşma yakında geliyor." />;
export const KaydedilenlerPage = () => <Stub title="Kaydedilenler" note="Kaydettiğin profiller burada listelenecek." />;
export const BildirimlerPage = () => <Stub title="Bildirimler" note="Bildirimlerin burada görünecek." />;
export const AbonelikPage = () => <Stub title="Abonelik" note="Üyelik ve ödeme yönetimi yakında geliyor." />;
export const AyarlarPage = () => <Stub title="Ayarlar" note="Hesap ve gizlilik ayarları yakında geliyor." />;
