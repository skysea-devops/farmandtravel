import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

export function SignUpPage() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || pw.length < 8 || !ok) return;
    signUp(email);
    nav("/onboarding");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8">
        <h1 className="font-display mb-1 text-2xl font-semibold">Hesap oluştur</h1>
        <p className="mb-5 text-sm text-ink-500">Topluluğa katılmak birkaç dakika sürer.</p>
        <form onSubmit={submit}>
          <Field label="E-posta"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="ornek@eposta.com" /></Field>
          <Field label="Şifre" hint="En az 8 karakter."><input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className={inp} placeholder="••••••••" /></Field>
          <label className="mb-4 flex items-start gap-2 text-[13px] text-ink-700">
            <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-1" />
            <span><a className="text-forest-600 underline">Kullanım Koşulları</a> ve <a className="text-forest-600 underline">Gizlilik Politikası</a>'nı (KVKK/GDPR) kabul ediyorum.</span>
          </label>
          <Button type="submit" size="lg" className="w-full">Hesabı oluştur</Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">Zaten üye misin? <Link to="/giris" className="text-forest-600 underline">Giriş yap</Link></p>
        <p className="mt-3 text-center text-xs text-ink-300">Dev modu: e-posta doğrulama/Cognito, altyapı yayına alınınca eklenecek.</p>
      </div>
    </div>
  );
}

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
