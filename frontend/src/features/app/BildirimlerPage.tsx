import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { notifications as notifApi, api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { AppNotification } from "@/lib/types";

type TFn = (tr: string, en: string) => string;

function describe(n: AppNotification, t: TFn): { text: string; to: string } {
  const who = n.actor?.firstName ?? t("Biri", "Someone");
  switch (n.type) {
    case "connection_request":
      return { text: t(`${who} sana bağlantı isteği gönderdi.`, `${who} sent you a connection request.`), to: "/app/baglantilar" };
    case "connection_accepted":
      return { text: t(`${who} bağlantı isteğini kabul etti.`, `${who} accepted your connection request.`), to: n.data.connectionId ? `/app/mesajlar/${n.data.connectionId}` : "/app/baglantilar" };
    case "message":
      return { text: t(`${who} sana mesaj gönderdi.`, `${who} sent you a message.`), to: n.data.connectionId ? `/app/mesajlar/${n.data.connectionId}` : "/app/mesajlar" };
    case "review":
      return { text: t(`${who} seni değerlendirdi.`, `${who} reviewed you.`), to: "/app/profil" };
    default:
      return { text: t("Yeni bildirim.", "New notification."), to: "/app" };
  }
}

function timeAgo(iso: string, t: TFn): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return t("az önce", "just now");
  if (s < 3600) return t(`${Math.floor(s / 60)} dk önce`, `${Math.floor(s / 60)} min ago`);
  if (s < 86400) return t(`${Math.floor(s / 3600)} saat önce`, `${Math.floor(s / 3600)} h ago`);
  return t(`${Math.floor(s / 86400)} gün önce`, `${Math.floor(s / 86400)} d ago`);
}

export function BildirimlerPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    notifApi.list<{ notifications: AppNotification[] }>()
      .then((r) => setItems(r.notifications))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        api.invalidate("/notifications/unread"); // badge refreshes (all marked read on fetch)
      });
  }, []);

  if (loading) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;

  return (
    <>
      <h1 className="font-display mb-5 text-2xl font-semibold">{t("Bildirimler", "Notifications")}</h1>
      {items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-ink-500">
          {t("Henüz bildirimin yok.", "No notifications yet.")}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const { text, to } = describe(n, t);
            return (
              <button key={n.id} onClick={() => navigate(to)}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-lg)] border p-3.5 text-left transition hover:bg-sand-100 ${n.read ? "border-border bg-surface" : "border-forest-500/40 bg-moss-500/10"}`}>
                <Avatar url={n.actor?.avatarUrl} className="size-10" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink-900">{text}</div>
                  <div className="text-xs text-ink-500">{timeAgo(n.createdAt, t)}</div>
                </div>
                {!n.read && <span className="size-2 shrink-0 rounded-full bg-forest-600" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
