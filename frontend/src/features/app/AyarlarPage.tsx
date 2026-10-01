import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";
const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="mb-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6">{children}</section>
);
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm">
    <span className="mb-1 block font-medium text-ink-700">{label}</span>
    {children}
  </label>
);

export function AyarlarPage() {
  const { t } = useI18n();
  const { changePassword, deleteAccount } = useAuth();
  const nav = useNavigate();

  // --- contact info ---
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    api.get<Profile>("/profile/me").then(setP).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (patch: Partial<Profile>) => setP((cur) => (cur ? { ...cur, ...patch } : cur));
  const socials = (p?.socials ?? {}) as Record<string, string>;

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!p) return;
    setSavingContact(true); setSavedMsg(null);
    try {
      await api.put("/profile", {
        lastName: p.lastName ?? undefined,
        contactEmail: p.contactEmail || undefined,
        phone: p.phone ?? undefined,
        employer: p.employer ?? undefined,
        addressExact: p.addressExact ?? undefined,
        socials,
      });
      api.invalidate("/profile/me");
      setSavedMsg(t("Kaydedildi.", "Saved."));
    } catch {
      setSavedMsg(t("Kaydedilemedi.", "Couldn't save."));
    } finally {
      setSavingContact(false);
    }
  }

  // --- change password ---
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) return;
    setPwBusy(true); setPwMsg(null);
    try {
      await changePassword(oldPw, newPw);
      setOldPw(""); setNewPw("");
      setPwMsg(t("Şifren değiştirildi.", "Password changed."));
    } catch (e) {
      setPwMsg(e instanceof Error ? e.message : t("Değiştirilemedi.", "Couldn't change."));
    } finally {
      setPwBusy(false);
    }
  }

  // --- delete account ---
  const [confirmDel, setConfirmDel] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);
  async function removeAccount() {
    setDelBusy(true); setDelErr(null);
    try {
      await deleteAccount();
      nav("/");
    } catch (e) {
      setDelErr(e instanceof Error ? e.message : t("Silinemedi.", "Couldn't delete."));
      setDelBusy(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display mb-5 text-2xl font-semibold">{t("Ayarlar", "Settings")}</h1>

      {/* İletişim bilgileri */}
      <Card>
        <h2 className="font-display mb-1 text-lg font-semibold">{t("İletişim bilgileri", "Contact details")}</h2>
        <p className="mb-4 text-sm text-ink-500">
          {t("Bu bilgiler yalnızca bir bağlantı isteğini karşılıklı kabul ettiğin kişilere görünür.", "These are shown only to people you've mutually connected with.")}
        </p>
        <form onSubmit={saveContact} className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Soyad", "Last name")}>
            <input className={inp} value={p?.lastName ?? ""} onChange={(e) => set({ lastName: e.target.value })} />
          </Field>
          <Field label={t("İletişim e-postası", "Contact email")}>
            <input type="email" className={inp} value={p?.contactEmail ?? ""} onChange={(e) => set({ contactEmail: e.target.value })} />
          </Field>
          <Field label={t("Telefon", "Phone")}>
            <input className={inp} value={p?.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label={t("İş yeri / çiftlik", "Workplace / farm")}>
            <input className={inp} value={p?.employer ?? ""} onChange={(e) => set({ employer: e.target.value })} />
          </Field>
          <Field label="Instagram">
            <input className={inp} value={socials.instagram ?? ""} onChange={(e) => set({ socials: { ...socials, instagram: e.target.value } })} placeholder="@kullanici" />
          </Field>
          <Field label={t("Web sitesi", "Website")}>
            <input className={inp} value={socials.website ?? ""} onChange={(e) => set({ socials: { ...socials, website: e.target.value } })} placeholder="https://" />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("Açık adres", "Full address")}>
              <input className={inp} value={p?.addressExact ?? ""} onChange={(e) => set({ addressExact: e.target.value })} />
            </Field>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={savingContact}>{savingContact ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}</Button>
            {savedMsg && <span className="text-sm text-ink-600">{savedMsg}</span>}
          </div>
        </form>
      </Card>

      {/* Şifre değiştir */}
      <Card>
        <h2 className="font-display mb-4 text-lg font-semibold">{t("Şifre değiştir", "Change password")}</h2>
        <form onSubmit={savePassword} className="grid max-w-sm gap-4">
          <Field label={t("Mevcut şifre", "Current password")}>
            <PasswordInput value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" required />
          </Field>
          <Field label={t("Yeni şifre", "New password")}>
            <PasswordInput value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" required />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pwBusy}>{pwBusy ? t("Değiştiriliyor…", "Changing…") : t("Şifreyi değiştir", "Change password")}</Button>
            {pwMsg && <span className="text-sm text-ink-600">{pwMsg}</span>}
          </div>
        </form>
      </Card>

      {/* Hesap silme */}
      <section className="rounded-[var(--radius-lg)] border border-[#eec4c0] bg-[#fbf0ef] p-6">
        <h2 className="font-display mb-1 text-lg font-semibold text-[#8a2f29]">{t("Hesabı sil", "Delete account")}</h2>
        <p className="mb-4 text-sm text-ink-700">
          {t("Hesabın ve tüm verilerin (profil, fotoğraflar, bağlantılar, mesajlar) kalıcı olarak silinir. Bu işlem geri alınamaz.", "Your account and all your data (profile, photos, connections, messages) are permanently deleted. This cannot be undone.")}
        </p>
        <label className="mb-3 flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={confirmDel} onChange={(e) => setConfirmDel(e.target.checked)} />
          {t("Verilerimin kalıcı olarak silineceğini anlıyorum.", "I understand my data will be permanently deleted.")}
        </label>
        {delErr && <p className="mb-3 text-sm text-[#8a2f29]">{delErr}</p>}
        <Button variant="outline" disabled={!confirmDel || delBusy} onClick={removeAccount}
          className="border-[#c0392b] text-[#8a2f29] hover:bg-[#f7e2e0]">
          {delBusy ? t("Siliniyor…", "Deleting…") : t("Hesabımı kalıcı olarak sil", "Permanently delete my account")}
        </Button>
      </section>
    </div>
  );
}
