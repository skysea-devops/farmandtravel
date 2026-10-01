import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export function LoginPage() {
  const { login, completeNewPassword, confirmSignUp, resendCode, forgotPassword, confirmForgotPassword } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [phase, setPhase] = useState<"login" | "confirm" | "forgot" | "newpass">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [sent, setSent] = useState(false); // reset code sent?
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function sendReset() {
    if (!email) { setErr(t("Önce e-postanı gir.", "Enter your email first.")); return; }
    setBusy(true); setErr(null);
    try {
      await forgotPassword(email);
      setSent(true);
      setInfo(t(`${email} adresine sıfırlama kodu gönderdik.`, `We sent a reset code to ${email}.`));
    } catch (e) { setErr(msg(e)); } finally { setBusy(false); }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!code || newPw.length < 8) return;
    setBusy(true); setErr(null);
    try {
      await confirmForgotPassword(email, code.trim(), newPw);
      await login(email, newPw);
      nav("/app");
    } catch (e) { setErr(msg(e)); } finally { setBusy(false); }
  }

  function goForgot() {
    setErr(null); setInfo(null); setSent(false); setCode(""); setNewPw("");
    setPhase("forgot");
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pw) return;
    setBusy(true); setErr(null);
    try {
      await login(email, pw);
      nav("/app");
    } catch (e) {
      const code = (e as { code?: string }).code;
      // Admin tarafından geçici şifreyle oluşturulan hesap: yeni şifre belirlet.
      if (code === "NewPasswordRequired") {
        setInfo(t("Bu ilk girişin. Lütfen yeni bir şifre belirle.", "This is your first login. Please set a new password."));
        setPhase("newpass");
      } else if (code === "UserNotConfirmedException") {
        // Hesap doğrulanmamışsa kod adımına geç ve yeni kod gönder.
        try { await resendCode(email); } catch { /* ignore */ }
        setInfo(t(`Hesabın doğrulanmamış. ${email} adresine yeni kod gönderdik.`, `Your account isn't verified. We sent a new code to ${email}.`));
        setPhase("confirm");
      } else {
        setErr(msg(e));
      }
    } finally { setBusy(false); }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) return;
    setBusy(true); setErr(null);
    try {
      await completeNewPassword(email, pw, newPw); // pw = temporary password entered on login
      nav("/app");
    } catch (e) { setErr(msg(e)); } finally { setBusy(false); }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    setBusy(true); setErr(null);
    try {
      await confirmSignUp(email, code.trim());
      await login(email, pw);
      nav("/onboarding");
    } catch (e) { setErr(msg(e)); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8">
        {phase === "login" ? (
          <>
            <h1 className="font-display mb-1 text-2xl font-semibold">{t("Giriş yap", "Log in")}</h1>
            <p className="mb-5 text-sm text-ink-500">{t("Tekrar hoş geldin.", "Welcome back.")}</p>
            {err && <Alert>{err}</Alert>}
            <form onSubmit={submitLogin}>
              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">{t("E-posta", "Email")}</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="ornek@eposta.com" />
              </div>
              <div className="mb-2">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">{t("Şifre", "Password")}</label>
                <PasswordInput required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </div>
              <div className="mb-4 text-right">
                <button type="button" onClick={goForgot} className="text-xs text-forest-600 hover:underline">{t("Şifremi unuttum", "Forgot password?")}</button>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t("Giriş yapılıyor…", "Logging in…") : t("Giriş yap", "Log in")}</Button>
            </form>
            <p className="mt-4 text-center text-sm text-ink-500">{t("Hesabın yok mu?", "No account yet?")} <Link to="/kayit" className="text-forest-600 underline">{t("Hesap oluştur", "Create account")}</Link></p>
          </>
        ) : phase === "forgot" ? (
          <>
            <h1 className="font-display mb-1 text-2xl font-semibold">{t("Şifreni sıfırla", "Reset password")}</h1>
            <p className="mb-5 text-sm text-ink-500">{t("E-postana bir kod göndereceğiz, sonra yeni şifreni belirle.", "We'll email you a code, then you set a new password.")}</p>
            {info && <Alert kind="info">{info}</Alert>}
            {err && <Alert>{err}</Alert>}
            <div className="mb-4">
              <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">{t("E-posta", "Email")}</label>
              <div className="flex gap-2">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="ornek@eposta.com" />
                <Button type="button" variant="outline" onClick={sendReset} disabled={busy}>{sent ? t("Tekrar", "Resend") : t("Kod gönder", "Send code")}</Button>
              </div>
            </div>
            {sent && (
              <form onSubmit={submitReset}>
                <div className="mb-4">
                  <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">{t("Sıfırlama kodu", "Reset code")}</label>
                  <input inputMode="numeric" required value={code} onChange={(e) => setCode(e.target.value)} className={inp} placeholder="123456" />
                </div>
                <div className="mb-4">
                  <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">{t("Yeni şifre", "New password")}</label>
                  <PasswordInput required value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                  <p className="mt-1.5 text-xs text-ink-500">{t("En az 8 karakter; büyük harf, küçük harf ve rakam içermeli.", "At least 8 characters, with upper- and lower-case letters and a number.")}</p>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t("Sıfırlanıyor…", "Resetting…") : t("Şifreyi sıfırla ve giriş yap →", "Reset and log in →")}</Button>
              </form>
            )}
            <div className="mt-4 text-center text-sm">
              <button onClick={() => setPhase("login")} className="text-ink-500 hover:text-ink-900">{t("← Girişe dön", "← Back to login")}</button>
            </div>
          </>
        ) : phase === "newpass" ? (
          <>
            <h1 className="font-display mb-1 text-2xl font-semibold">{t("Yeni şifre belirle", "Set a new password")}</h1>
            <p className="mb-5 text-sm text-ink-500">{t("Hesabın için kalıcı bir şifre belirle.", "Set a permanent password for your account.")}</p>
            {info && <Alert kind="info">{info}</Alert>}
            {err && <Alert>{err}</Alert>}
            <form onSubmit={submitNewPassword}>
              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">{t("Yeni şifre", "New password")}</label>
                <PasswordInput required value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                <p className="mt-1.5 text-xs text-ink-500">{t("En az 8 karakter; büyük harf, küçük harf ve rakam içermeli.", "At least 8 characters, with upper- and lower-case letters and a number.")}</p>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t("Kaydediliyor…", "Saving…") : t("Şifreyi belirle ve giriş yap →", "Set password and log in →")}</Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button onClick={() => setPhase("login")} className="text-ink-500 hover:text-ink-900">{t("← Girişe dön", "← Back to login")}</button>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display mb-1 text-2xl font-semibold">{t("E-postanı doğrula", "Verify your email")}</h1>
            <p className="mb-5 text-sm text-ink-500">{t("adresine gönderilen kodu gir.", "Enter the code sent to")} <b>{email}</b></p>
            {info && <Alert kind="info">{info}</Alert>}
            {err && <Alert>{err}</Alert>}
            <form onSubmit={submitCode}>
              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">{t("Doğrulama kodu", "Verification code")}</label>
                <input inputMode="numeric" required value={code} onChange={(e) => setCode(e.target.value)} className={inp} placeholder="123456" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t("Doğrulanıyor…", "Verifying…") : t("Doğrula ve giriş yap →", "Verify and log in →")}</Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button onClick={() => setPhase("login")} className="text-ink-500 hover:text-ink-900">{t("← Girişe dön", "← Back to login")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function msg(e: unknown) { return e instanceof Error ? e.message : "Bir hata oluştu."; }

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";

function Alert({ children, kind = "error" }: { children: React.ReactNode; kind?: "error" | "info" }) {
  const cls = kind === "info"
    ? "border-[#c4ddc8] bg-[#e6f2e8] text-[#2c5d34]"
    : "border-[#eec4c0] bg-[#f7e2e0] text-[#8a2f29]";
  return <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
