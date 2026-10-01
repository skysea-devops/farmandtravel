import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export function SignUpPage() {
  const { signUp, confirmSignUp, resendCode, login } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [phase, setPhase] = useState<"form" | "confirm">("form");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!email || pw.length < 8 || !ok) return;
    setBusy(true); setErr(null);
    try {
      await signUp(email, pw);
      setInfo(t(`Doğrulama kodu ${email} adresine gönderildi.`, `A verification code was sent to ${email}.`));
      setPhase("confirm");
    } catch (e) { setErr(msg(e)); } finally { setBusy(false); }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    setBusy(true); setErr(null);
    try {
      await confirmSignUp(email, code.trim());
      await login(email, pw); // hesap doğrulandı → otomatik giriş
      nav("/onboarding");
    } catch (e) { setErr(msg(e)); } finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setErr(null); setInfo(null);
    try {
      await resendCode(email);
      setInfo(t("Yeni kod gönderildi.", "A new code was sent."));
    } catch (e) { setErr(msg(e)); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8">
        {phase === "form" ? (
          <>
            <h1 className="font-display mb-1 text-2xl font-semibold">{t("Hesap oluştur", "Create account")}</h1>
            <p className="mb-5 text-sm text-ink-500">{t("Topluluğa katılmak birkaç dakika sürer.", "Joining the community takes just a couple of minutes.")}</p>
            {err && <Alert>{err}</Alert>}
            <form onSubmit={submitForm}>
              <Field label={t("E-posta", "Email")}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="ornek@eposta.com" />
              </Field>
              <Field label={t("Şifre", "Password")} hint={t("En az 8 karakter; büyük harf, küçük harf ve rakam içermeli.", "At least 8 characters, with upper- and lower-case letters and a number.")}>
                <PasswordInput required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
              </Field>
              <label className="mb-4 flex items-start gap-2 text-[13px] text-ink-700">
                <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-1" />
                <span>
                  <a className="text-forest-600 underline">{t("Kullanım Koşulları", "Terms of Use")}</a>
                  {t(" ve ", " and ")}
                  <a className="text-forest-600 underline">{t("Gizlilik Politikası", "Privacy Policy")}</a>
                  {t("'nı (KVKK/GDPR) kabul ediyorum.", " (GDPR/KVKK) — I accept.")}
                </span>
              </label>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t("Gönderiliyor…", "Sending…") : t("Hesabı oluştur", "Create account")}</Button>
            </form>
            <p className="mt-4 text-center text-sm text-ink-500">{t("Zaten üye misin?", "Already a member?")} <Link to="/giris" className="text-forest-600 underline">{t("Giriş yap", "Log in")}</Link></p>
          </>
        ) : (
          <>
            <h1 className="font-display mb-1 text-2xl font-semibold">{t("E-postanı doğrula", "Verify your email")}</h1>
            <p className="mb-5 text-sm text-ink-500">{t("adresine gönderilen 6 haneli kodu gir.", "Enter the 6-digit code sent to")} <b>{email}</b></p>
            {info && <Alert kind="info">{info}</Alert>}
            {err && <Alert>{err}</Alert>}
            <form onSubmit={submitCode}>
              <Field label={t("Doğrulama kodu", "Verification code")}>
                <input inputMode="numeric" required value={code} onChange={(e) => setCode(e.target.value)} className={inp} placeholder="123456" />
              </Field>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t("Doğrulanıyor…", "Verifying…") : t("Doğrula ve devam et →", "Verify and continue →")}</Button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm">
              <button onClick={() => setPhase("form")} className="text-ink-500 hover:text-ink-900">{t("← Geri", "← Back")}</button>
              <button onClick={resend} disabled={busy} className="text-forest-600 underline disabled:opacity-50">{t("Kodu tekrar gönder", "Resend code")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function msg(e: unknown) { return e instanceof Error ? e.message : "Bir hata oluştu."; }

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

function Alert({ children, kind = "error" }: { children: React.ReactNode; kind?: "error" | "info" }) {
  const cls = kind === "info"
    ? "border-[#c4ddc8] bg-[#e6f2e8] text-[#2c5d34]"
    : "border-[#eec4c0] bg-[#f7e2e0] text-[#8a2f29]";
  return <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
