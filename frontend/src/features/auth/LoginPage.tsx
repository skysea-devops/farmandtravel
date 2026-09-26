import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return;
    login(email);
    nav("/profil");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8">
        <h1 className="font-display mb-1 text-2xl font-semibold">Giriş yap</h1>
        <p className="mb-5 text-sm text-ink-500">Tekrar hoş geldin.</p>
        <form onSubmit={submit}>
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">E-posta</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="ornek@eposta.com" />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink-700">Şifre</label>
            <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className={inp} placeholder="••••••••" />
          </div>
          <Button type="submit" size="lg" className="w-full">Giriş yap</Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-500">Hesabın yok mu? <Link to="/kayit" className="text-forest-600 underline">Hesap oluştur</Link></p>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";
