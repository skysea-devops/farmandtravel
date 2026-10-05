import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("Ana sayfa", "Home"), end: true },
    { to: "/hakkimizda", label: t("Biz kimiz", "About") },
    { to: "/kesfet", label: t("Keşfet", "Explore") },
    { to: "/aktiviteler", label: t("Aktiviteler", "Activities") },
  ];

  const linkClass = (isActive: boolean) =>
    cn("rounded-full px-3.5 py-2 text-sm font-medium transition", isActive ? "bg-forest-600 text-white" : "text-ink-700 hover:bg-sand-100");

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="container-x flex items-center gap-4 py-3.5">
        <Link to="/" onClick={() => setOpen(false)} className="font-display flex items-center gap-2 text-lg font-semibold sm:text-[21px]">
          <img src="/logo-mark.png" alt="" className="size-[30px] shrink-0 rounded-full bg-white object-contain p-0.5" />
          {t("Toprakla Yeniden", "Reconnect with Soil")}
        </Link>

        {/* Desktop nav */}
        <div className="ml-6 hidden gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => linkClass(isActive)}>
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="ml-auto hidden items-center gap-2.5 md:flex">
          {user ? (
            <>
              <Link to="/app/profil"><Button variant="ghost" size="sm">{t("Profilim", "Profile")}</Button></Link>
              <Button size="sm" variant="outline" onClick={() => { logout(); nav("/"); }}>{t("Çıkış", "Log out")}</Button>
            </>
          ) : (
            <>
              <Link to="/giris"><Button variant="ghost" size="sm">{t("Giriş yap", "Log in")}</Button></Link>
              <Link to="/kayit"><Button size="sm">{t("Başla", "Get started")}</Button></Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={t("Menü", "Menu")}
          aria-expanded={open}
          className="ml-auto grid size-10 place-items-center rounded-lg text-2xl text-ink-700 hover:bg-sand-100 md:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-border bg-bg px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className={({ isActive }) => linkClass(isActive)}>
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {user ? (
              <>
                <Link to="/app/profil" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="w-full">{t("Profilim", "Profile")}</Button></Link>
                <Button size="sm" variant="outline" className="w-full" onClick={() => { setOpen(false); logout(); nav("/"); }}>{t("Çıkış", "Log out")}</Button>
              </>
            ) : (
              <>
                <Link to="/giris" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="w-full">{t("Giriş yap", "Log in")}</Button></Link>
                <Link to="/kayit" onClick={() => setOpen(false)}><Button size="sm" className="w-full">{t("Başla", "Get started")}</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
