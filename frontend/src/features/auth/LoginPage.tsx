import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

export function LoginPage() {
  const { login, confirmSignUp, resendCode } = useAuth();
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
        setInfo(`Hesabın doğrulanmamış. ${email} adresine yeni kod gönderdik.`);
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
            <h1 className="font-display mb-1 text-2xl font-semibold">Giriş yap</h1>
            <p className="mb-5 text-sm text-ink-500">Tekrar hoş geldin.</p>
            {err && <Alert>{err}</Alert>}
            <form onSubmit={submitLogin}>
              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">E-posta</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="ornek@eposta.com" />
              </div>
              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">Şifre</label>
                <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className={inp} placeholder="••••••••" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Giriş yapılıyor…" : "Giriş yap"}</Button>
            </form>
            <p className="mt-4 text-center text-sm text-ink-500">Hesabın yok mu? <Link to="/kayit" className="text-forest-600 underline">Hesap oluştur</Link></p>
          </>
        ) : (
          <>
            <h1 className="font-display mb-1 text-2xl font-semibold">E-postanı doğrula</h1>
            <p className="mb-5 text-sm text-ink-500"><b>{email}</b> adresine gönderilen kodu gir.</p>
            {info && <Alert kind="info">{info}</Alert>}
            {err && <Alert>{err}</Alert>}
            <form onSubmit={submitCode}>
              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">Doğrulama kodu</label>
                <input inputMode="numeric" required value={code} onChange={(e) => setCode(e.target.value)} className={inp} placeholder="123456" />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Doğrulanıyor…" : "Doğrula ve giriş yap →"}</Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button onClick={() => setPhase("login")} className="text-ink-500 hover:text-ink-900">← Girişe dön</button>
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
