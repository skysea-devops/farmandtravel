import { NavLink, Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const links = [
    { to: "/", label: t("Ana sayfa", "Home"), end: true },
    { to: "/hakkimizda", label: t("Biz kimiz", "About") },
    { to: "/kesfet", label: t("Keşfet", "Explore") },
    { to: "/aktiviteler", label: t("Aktiviteler", "Activities") },
  ];
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="container-x flex items-center gap-4 py-3.5">
        <Link to="/" className="font-display flex items-center gap-2 text-[21px] font-semibold">
          <span className="grid size-[30px] place-items-center rounded-full bg-moss-500 text-forest-900">🌿</span>
          {t("Toprakla Yeniden", "Reconnect with Soil")}
        </Link>
        <div className="ml-6 flex gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition",
                  isActive ? "bg-forest-600 text-white" : "text-ink-700 hover:bg-sand-100",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          {user ? (
            <>
              <Link to="/app/profil"><Button variant="ghost" size="sm">{t("Profilim", "Profile")}</Button></Link>
              <Button size="sm" variant="outline" onClick={() => { logout(); nav("/"); }}>{t("Çıkış", "Log out")}</Button>
            </>
          ) : (
            <>
              <Link to="/giris" className="max-sm:hidden"><Button variant="ghost" size="sm">{t("Giriş yap", "Log in")}</Button></Link>
              <Link to="/kayit"><Button size="sm">{t("Başla", "Get started")}</Button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
