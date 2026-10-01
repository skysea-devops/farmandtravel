import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { api, uploadImage } from "@/lib/api";
import type { Axis, Photo, Profile } from "@/lib/types";

const AXIS_LABEL: Record<Axis, string> = { situation: "Durumum", seek: "Aradıklarım", offer: "Sunduklarım", topic: "İlgi alanlarım" };
const AXES: Axis[] = ["situation", "seek", "offer", "topic"];

export function ProfilePage() {
  const [p, setP] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  // Editable private contact details (revealed only on an accepted connection).
  const emptyContact = { lastName: "", contactEmail: "", phone: "", employer: "", addressExact: "", instagram: "", website: "" };
  const [contact, setContact] = useState(emptyContact);
  const [cBusy, setCBusy] = useState(false);
  const [cMsg, setCMsg] = useState<string | null>(null);

  function load() {
    api.getCached<Profile>("/profile/me")
      .then((data) => {
        setP(data);
        const s = (data.socials ?? {}) as Record<string, string>;
        setContact({
          lastName: data.lastName ?? "", contactEmail: data.contactEmail ?? "", phone: data.phone ?? "",
          employer: data.employer ?? "", addressExact: data.addressExact ?? "",
          instagram: s.instagram ?? "", website: s.website ?? "",
        });
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setCBusy(true); setCMsg(null);
    try {
      await api.put("/profile", {
        lastName: contact.lastName || undefined,
        contactEmail: contact.contactEmail || undefined,
        phone: contact.phone || undefined,
        employer: contact.employer || undefined,
        addressExact: contact.addressExact || undefined,
        socials: { instagram: contact.instagram, website: contact.website },
      });
      api.invalidate("/profile/me");
      setCMsg("Kaydedildi.");
    } catch (e) {
      setCMsg(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setCBusy(false);
    }
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const key = await uploadImage(file, "avatar");
      await api.put("/profile", { avatarKey: key });
      api.invalidate();
      load();
    } catch (e) { alert(e instanceof Error ? e.message : "Yükleme hatası"); }
    finally { setBusy(false); if (avatarInput.current) avatarInput.current.value = ""; }
  }

  async function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        const key = await uploadImage(file, "gallery");
        await api.post("/profile/photos", { key });
      }
      api.invalidate();
      load();
    } catch (e) { alert(e instanceof Error ? e.message : "Yükleme hatası"); }
    finally { setBusy(false); if (galleryInput.current) galleryInput.current.value = ""; }
  }

  async function removePhoto(id: string) {
    setBusy(true);
    try { await api.del(`/profile/photos/${id}`); api.invalidate(); load(); }
    catch (e) { alert(e instanceof Error ? e.message : "Silme hatası"); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">Yükleniyor…</div>;
  if (err) return <div className="py-16 text-center text-ink-700">Profil yüklenemedi: {err}</div>;
  if (!p) return null;

  const photos = p.photos ?? [];

  return (
    <div className="max-w-3xl">
      {p.status === "onboarding" && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-[#ecd9a8] bg-[#f7edd6] px-4 py-3 text-sm text-[#8a6015]">
          <span>Profilin henüz tamamlanmadı.</span>
          <Link to="/onboarding"><Button size="sm">Tamamla</Button></Link>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <Avatar url={p.avatarUrl} className="size-20" />
          <button onClick={() => avatarInput.current?.click()} disabled={busy}
            className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-border bg-surface text-sm shadow-sm hover:bg-sand-100"
            title="Profil fotoğrafı değiştir">📷</button>
          <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onAvatar} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">{p.firstName ?? "İsimsiz"}</h1>
          <div className="text-sm text-ink-500">{[p.city, p.country].filter(Boolean).join(", ") || "Konum eklenmedi"}{p.headline ? ` · ${p.headline}` : ""}</div>
        </div>
      </div>

      {p.bio && <Block title="Hakkımda"><p className="text-sm text-ink-700">{p.bio}</p></Block>}

      <Block title="Fotoğraflarım">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((ph: Photo) => (
            <div key={ph.id} className="group relative aspect-square overflow-hidden rounded-lg bg-sand-100">
              {ph.url && <img src={ph.url} alt="" className="h-full w-full object-cover" />}
              <button onClick={() => removePhoto(ph.id)} disabled={busy}
                className="absolute right-1 top-1 hidden size-6 place-items-center rounded-full bg-black/50 text-xs text-white group-hover:grid"
                title="Sil">✕</button>
            </div>
          ))}
          {photos.length < 12 && (
            <button onClick={() => galleryInput.current?.click()} disabled={busy}
              className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-border-strong text-ink-500 hover:border-forest-500 hover:text-forest-600">
              <span className="text-center text-xs">{busy ? "…" : "+ Fotoğraf"}</span>
            </button>
          )}
        </div>
        <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={onGallery} />
        <p className="mt-2 text-xs text-ink-500">Çiftliğinden, projenden ya da kendinden fotoğraflar ekle (en fazla 12).</p>
      </Block>

      {AXES.map((axis) => {
        const tags = p.tags.filter((t) => t.axis === axis);
        if (tags.length === 0) return null;
        return (
          <Block key={axis} title={AXIS_LABEL[axis]}>
            <div className="flex flex-wrap gap-2">{tags.map((t) => <Tag key={t.value} axis={t.axis}>{t.labelTr}</Tag>)}</div>
          </Block>
        );
      })}

      <Block title="İletişim bilgileri">
        <p className="mb-3 text-xs text-ink-500">Bu bilgiler yalnızca bir bağlantı isteğini karşılıklı kabul ettiğin kişilere görünür.</p>
        <form onSubmit={saveContact} className="grid gap-3 sm:grid-cols-2">
          <CField label="Soyad" value={contact.lastName} onChange={(v) => setContact({ ...contact, lastName: v })} />
          <CField label="İletişim e-postası" type="email" value={contact.contactEmail} onChange={(v) => setContact({ ...contact, contactEmail: v })} />
          <CField label="Telefon" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
          <CField label="İş yeri / çiftlik" value={contact.employer} onChange={(v) => setContact({ ...contact, employer: v })} />
          <CField label="Instagram" value={contact.instagram} onChange={(v) => setContact({ ...contact, instagram: v })} placeholder="@kullanici" />
          <CField label="Web sitesi" value={contact.website} onChange={(v) => setContact({ ...contact, website: v })} placeholder="https://" />
          <div className="sm:col-span-2">
            <CField label="Açık adres" value={contact.addressExact} onChange={(v) => setContact({ ...contact, addressExact: v })} />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" size="sm" disabled={cBusy}>{cBusy ? "Kaydediliyor…" : "Kaydet"}</Button>
            {cMsg && <span className="text-sm text-ink-600">{cMsg}</span>}
          </div>
        </form>
      </Block>

      <div className="mt-2 rounded-lg border border-[#c4dde5] bg-[#e0edf1] px-4 py-3 text-sm text-[#2c5462]">
        👁️ Bağlantı öncesi başkaları yalnızca adını, şehrini/ülkeni, fotoğraflarını ve etiketlerini görür. İletişim bilgilerin gizli kalır.
      </div>
    </div>
  );
}

const cinp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";
function CField({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink-700">{label}</span>
      <input type={type ?? "text"} className={cinp} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="mb-2.5 text-[15px] font-semibold">{title}</h2>
      {children}
    </div>
  );
}
