import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export function LoginPage() {
  const { login, confirmSignUp, resendCode } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [phase, setPhase] = useState<"login" | "confirm">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pw) return;
    setBusy(true); setErr(null);
    try {
      await login(email, pw);
      nav("/app");
    } catch (e) {
      // Hesap doğrulanmamışsa kod adımına geç ve yeni kod gönder.
      if ((e as { code?: string }).code === "UserNotConfirmedException") {
        try { await resendCode(email); } catch { /* ignore */ }
        setInfo(t(`Hesabın doğrulanmamış. ${email} adresine yeni kod gönderdik.`, `Your account isn't verified. We sent a new code to ${email}.`));
        setPhase("confirm");
      } else {
        setErr(msg(e));
      }
    } finally { setBusy(false); }
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
              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">{t("Şifre", "Password")}</label>
                <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className={inp} placeholder="••••••••" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t("Giriş yapılıyor…", "Logging in…") : t("Giriş yap", "Log in")}</Button>
            </form>
            <p className="mt-4 text-center text-sm text-ink-500">{t("Hesabın yok mu?", "No account yet?")} <Link to="/kayit" className="text-forest-600 underline">{t("Hesap oluştur", "Create account")}</Link></p>
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
