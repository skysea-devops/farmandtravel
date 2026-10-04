import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { messages as msgApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { msgTime, listTime } from "@/lib/time";
import type { Conversation, Message, Thread } from "@/lib/types";

export function MesajlarPage() {
  const { connectionId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
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
        <h1 className="font-display mb-3 text-2xl font-semibold">{t("Mesajlar", "Messages")}</h1>
        {loading ? (
          <div className="py-10 text-center text-sm text-ink-500">{t("Yükleniyor…", "Loading…")}</div>
        ) : convos.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-ink-500">
            {t("Henüz sohbet yok. Bir bağlantınla mesajlaşmaya başla.", "No conversations yet. Start messaging one of your connections.")}
          </div>
        ) : (
          <div className="space-y-1.5">
            {convos.map((c) => (
              <button key={c.connectionId} onClick={() => navigate(`/app/mesajlar/${c.connectionId}`)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
                  connectionId === c.connectionId ? "border-forest-500 bg-sand-100" : "border-border bg-surface hover:bg-sand-100",
                )}>
                <Avatar url={c.member.avatarUrl} className="size-10" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{c.member.firstName}</span>
                    {c.lastAt && <span className="ml-auto shrink-0 text-[11px] text-ink-400">{listTime(c.lastAt)}</span>}
                    {c.unread > 0 && <span className="shrink-0 rounded-full bg-forest-600 px-1.5 text-[11px] font-semibold text-white">{c.unread}</span>}
                  </div>
                  <div className="truncate text-[13px] text-ink-500">{c.lastBody ?? t("Henüz mesaj yok", "No messages yet")}</div>
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
            {t("Bir sohbet seç.", "Pick a conversation.")}
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadView({ connectionId, onSent, onBack }: { connectionId: string; onSent: () => void; onBack: () => void }) {
  const { t } = useI18n();
  const [meta, setMeta] = useState<{ me: string; other: Thread["other"] } | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgsRef = useRef<Message[]>([]);
  const shouldScrollRef = useRef(true);
  msgsRef.current = msgs;

  // Merge new messages (by id), keeping chronological order. Returns true if anything was added.
  function mergeAppend(incoming: Message[]) {
    if (incoming.length === 0) return false;
    const have = new Set(msgsRef.current.map((m) => m.id));
    const fresh = incoming.filter((m) => !have.has(m.id));
    if (fresh.length === 0) return false;
    setMsgs((prev) => [...prev, ...fresh]);
    return true;
  }

  // Initial load: latest page.
  useEffect(() => {
    let alive = true;
    shouldScrollRef.current = true;
    msgApi.thread<Thread>(connectionId).then((r) => {
      if (!alive) return;
      setMeta({ me: r.me, other: r.other });
      setMsgs(r.messages);
      setHasMore(r.hasMore);
    }).catch(() => {});
    return () => { alive = false; };
  }, [connectionId]);

  // Light poll: fetch only messages newer than the last one we have.
  useEffect(() => {
    const iv = setInterval(() => {
      const last = msgsRef.current[msgsRef.current.length - 1];
      msgApi.thread<Thread>(connectionId, last ? { after: last.createdAt } : undefined)
        .then((r) => { if (mergeAppend(r.messages)) shouldScrollRef.current = true; })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  // Scroll to bottom only when something was appended (initial/new/sent), not on load-older.
  useEffect(() => {
    if (shouldScrollRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }
  }, [msgs]);

  async function loadOlder() {
    const first = msgs[0];
    if (!first || loadingOlder) return;
    setLoadingOlder(true);
    const box = scrollRef.current;
    const prevH = box?.scrollHeight ?? 0;
    try {
      const r = await msgApi.thread<Thread>(connectionId, { before: first.createdAt });
      const have = new Set(msgsRef.current.map((m) => m.id));
      const older = r.messages.filter((m) => !have.has(m.id));
      shouldScrollRef.current = false;
      setMsgs((prev) => [...older, ...prev]);
      setHasMore(r.hasMore);
      // Keep the viewport anchored where the user was (no jump to top).
      requestAnimationFrame(() => { if (box) box.scrollTop = box.scrollHeight - prevH; });
    } catch { /* ignore */ } finally { setLoadingOlder(false); }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const sent = await msgApi.send<Message>(connectionId, body);
      setText("");
      if (sent?.id) { shouldScrollRef.current = true; mergeAppend([sent]); }
      onSent();
    } finally { setSending(false); }
  }

  if (!meta) return <div className="py-10 text-center text-sm text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;

  return (
    <div className="flex h-[70vh] flex-col rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border p-3.5">
        <button onClick={onBack} className="text-ink-500 md:hidden">←</button>
        <Avatar url={meta.other?.avatarUrl} className="size-9" />
        <div className="font-semibold">{meta.other?.firstName ?? t("Üye", "Member")}</div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {hasMore && (
          <div className="pb-2 text-center">
            <button onClick={loadOlder} disabled={loadingOlder}
              className="rounded-full border border-border px-3 py-1 text-xs text-ink-500 hover:bg-sand-100 disabled:opacity-50">
              {loadingOlder ? t("Yükleniyor…", "Loading…") : t("Daha eski mesajlar", "Older messages")}
            </button>
          </div>
        )}
        {msgs.length === 0 && <div className="py-8 text-center text-sm text-ink-500">{t("İlk mesajı sen yaz 👋", "Say hello 👋")}</div>}
        {msgs.map((m: Message) => {
          const mine = m.senderId === meta.me;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                mine ? "bg-forest-600 text-white" : "bg-sand-100 text-ink-900",
              )}>
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className={cn("mt-1 text-right text-[10px]", mine ? "text-white/70" : "text-ink-400")}>{msgTime(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Mesaj yaz…", "Write a message…")}
          className="flex-1 rounded-full border border-border-strong bg-bg px-4 py-2 text-sm outline-none focus:border-forest-600" />
        <Button type="submit" size="sm" disabled={sending || !text.trim()}>{t("Gönder", "Send")}</Button>
      </form>
    </div>
  );
}
