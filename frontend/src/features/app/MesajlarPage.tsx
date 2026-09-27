import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { messages as msgApi } from "@/lib/api";
import type { Conversation, Message, Thread } from "@/lib/types";

export function MesajlarPage() {
  const { connectionId } = useParams();
  const navigate = useNavigate();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  function loadList() {
    msgApi.list<{ conversations: Conversation[] }>()
      .then((r) => setConvos(r.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(loadList, []);

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      {/* Conversation list */}
      <div className={cn("md:block", connectionId ? "hidden" : "block")}>
        <h1 className="font-display mb-3 text-2xl font-semibold">Mesajlar</h1>
        {loading ? (
          <div className="py-10 text-center text-sm text-ink-500">Yükleniyor…</div>
        ) : convos.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-ink-500">
            Henüz sohbet yok. Bir bağlantınla mesajlaşmaya başla.
          </div>
        ) : (
          <div className="space-y-1.5">
            {convos.map((c) => (
              <button key={c.connectionId} onClick={() => navigate(`/app/mesajlar/${c.connectionId}`)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
                  connectionId === c.connectionId ? "border-forest-500 bg-sand-100" : "border-border bg-surface hover:bg-sand-100",
                )}>
                <div className="size-10 shrink-0 rounded-full bg-linear-135 from-moss-300 to-clay-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{c.member.firstName}</span>
                    {c.unread > 0 && <span className="ml-auto rounded-full bg-forest-600 px-1.5 text-[11px] font-semibold text-white">{c.unread}</span>}
                  </div>
                  <div className="truncate text-[13px] text-ink-500">{c.lastBody ?? "Henüz mesaj yok"}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thread */}
      <div className={cn("md:block", connectionId ? "block" : "hidden md:block")}>
        {connectionId ? (
          <ThreadView key={connectionId} connectionId={connectionId} onSent={loadList} onBack={() => navigate("/app/mesajlar")} />
        ) : (
          <div className="grid h-full min-h-[300px] place-items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface text-sm text-ink-500">
            Bir sohbet seç.
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadView({ connectionId, onSent, onBack }: { connectionId: string; onSent: () => void; onBack: () => void }) {
  const [t, setT] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  function load() {
    msgApi.thread<Thread>(connectionId).then(setT).catch(() => {});
  }
  useEffect(() => {
    load();
    const iv = setInterval(load, 10000); // light poll for new messages
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [t?.messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await msgApi.send(connectionId, body);
      setText("");
      load();
      onSent();
    } finally { setSending(false); }
  }

  if (!t) return <div className="py-10 text-center text-sm text-ink-500">Yükleniyor…</div>;

  return (
    <div className="flex h-[70vh] flex-col rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border p-3.5">
        <button onClick={onBack} className="text-ink-500 md:hidden">←</button>
        <div className="size-9 shrink-0 rounded-full bg-linear-135 from-moss-300 to-clay-500" />
        <div className="font-semibold">{t.other?.firstName ?? "Üye"}</div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {t.messages.length === 0 && <div className="py-8 text-center text-sm text-ink-500">İlk mesajı sen yaz 👋</div>}
        {t.messages.map((m: Message) => {
          const mine = m.senderId === t.me;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                mine ? "bg-forest-600 text-white" : "bg-sand-100 text-ink-900",
              )}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mesaj yaz…"
          className="flex-1 rounded-full border border-border-strong bg-bg px-4 py-2 text-sm outline-none focus:border-forest-600" />
        <Button type="submit" size="sm" disabled={sending || !text.trim()}>Gönder</Button>
      </form>
    </div>
  );
}
