import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="mb-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6">{children}</section>
);
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm">
    <span className="mb-1 block font-medium text-ink-700">{label}</span>
    {children}
  </label>
);
const Row = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-ink-500">{label}</div>
    <div className="text-sm text-ink-900">{value || "—"}</div>
  </div>
);

export function AyarlarPage() {
  const { t } = useI18n();
  const { changePassword, deleteAccount } = useAuth();
  const nav = useNavigate();

  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCached<Profile>("/profile/me").then(setP).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

  const socials = (p?.socials ?? {}) as Record<string, string>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display mb-5 text-2xl font-semibold">{t("Ayarlar", "Settings")}</h1>

      {/* Hesap bilgileri — salt okunur; düzenleme Profil sayfasında */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{t("Hesap bilgileri", "Account info")}</h2>
          <Link to="/app/profil" className="text-sm text-forest-600 hover:underline">{t("Profilde düzenle", "Edit in profile")}</Link>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Row label={t("Ad", "First name")} value={p?.firstName ?? ""} />
          <Row label={t("Şehir / Ülke", "City / Country")} value={[p?.city, p?.country].filter(Boolean).join(", ")} />
          <Row label={t("Soyad", "Last name")} value={p?.lastName ?? ""} />
          <Row label={t("İletişim e-postası", "Contact email")} value={p?.contactEmail ?? ""} />
          <Row label={t("Telefon", "Phone")} value={p?.phone ?? ""} />
          <Row label={t("İş yeri / çiftlik", "Workplace / farm")} value={p?.employer ?? ""} />
          <Row label="Instagram" value={socials.instagram ?? ""} />
          <Row label={t("Web sitesi", "Website")} value={socials.website ?? ""} />
          <div className="col-span-2"><Row label={t("Adres", "Address")} value={p?.addressExact ?? ""} /></div>
        </div>
        <p className="mt-4 text-xs text-ink-500">
          {t("Bu bilgiler profil sayfandan düzenlenir. İletişim bilgilerin yalnızca karşılıklı bağlantı kurduğun kişilere görünür.", "These are edited on your profile page. Contact details are shown only to people you've mutually connected with.")}
        </p>
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
