import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, notifications as notifApi } from "@/lib/api";
import type { Profile } from "@/lib/types";

export function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes (i.e. after tapping an item).
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const nav = [
    { to: "/app", label: t("Panel", "Home"), icon: "🏠", end: true },
    { to: "/app/kesfet", label: t("Keşfet", "Discover"), icon: "🔍" },
    { to: "/app/baglantilar", label: t("Bağlantılar", "Connections"), icon: "🤝" },
    { to: "/app/mesajlar", label: t("Mesajlar", "Messages"), icon: "💬" },
    { to: "/app/kaydedilenler", label: t("Kaydedilenler", "Saved"), icon: "🔖" },
    { to: "/app/bildirimler", label: t("Bildirimler", "Notifications"), icon: "🔔" },
    { to: "/app/profil", label: t("Profilim", "My profile"), icon: "👤" },
  ];
  const navBottom = [
    { to: "/app/abonelik", label: t("Abonelik", "Membership"), icon: "💳" },
    { to: "/app/ayarlar", label: t("Ayarlar", "Settings"), icon: "⚙️" },
  ];

  // Refresh the bell badge on navigation (cheap, cached 30s).
  useEffect(() => {
    notifApi.unread<{ unread: number }>().then((r) => setUnread(r.unread)).catch(() => {});
  }, [location.pathname]);

  // Load profile: admin link, plan badge, and bounce unfinished onboarding to /onboarding.
  useEffect(() => {
    api.getCached<Profile>("/profile/me")
      .then((p) => {
        setIsAdmin(!!p.isAdmin);
        setPlan(p.plan ?? "");
        if (p.status === "onboarding") navigate("/onboarding", { replace: true });
      })
      .catch(() => {});
  }, [navigate]);

  const planBadge =
    plan === "frontier" ? { text: t("🌱 Öncü üye · ücretsiz", "🌱 Founding member · free"), cls: "text-moss-300" }
    : plan === "active" ? { text: t("● Üyelik aktif", "● Membership active"), cls: "text-moss-300" }
    : plan === "none" ? { text: t("Üyelik gerekli", "Membership required"), cls: "text-clay-300" }
    : { text: "", cls: "text-moss-300" };

  const adminNav: typeof nav = isAdmin ? [{ to: "/app/aktivite-onay", label: t("Admin Panel", "Admin Panel"), icon: "🛡️" }] : [];

  const item = ({ to, label, icon, end }: { to: string; label: string; icon: string; end?: boolean }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition",
          isActive ? "bg-moss-500 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
        )
      }
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
      {to === "/app/bildirimler" && unread > 0 && (
        <span className="rounded-full bg-clay-500 px-1.5 text-[11px] font-semibold text-white">{unread}</span>
      )}
    </NavLink>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-forest-900 p-4 md:flex">
        <Link to="/" className="font-display mb-6 flex items-center gap-2 px-1.5 text-[19px] font-semibold text-white">
          <span className="grid size-8 place-items-center rounded-full bg-moss-500 text-forest-900">🌿</span>
          {t("Toprakla Yeniden", "Reconnect with Soil")}
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(item)}
          {adminNav.map(item)}
          <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3">
            {navBottom.map(item)}
          </div>
        </nav>
        <div className="mt-3 flex items-center gap-2.5 border-t border-white/10 pt-3">
          <div className="size-9 shrink-0 rounded-full bg-linear-135 from-moss-300 to-clay-500" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{user?.email?.split("@")[0] ?? t("Üye", "Member")}</div>
            {planBadge.text && <div className={cn("text-xs", planBadge.cls)}>{planBadge.text}</div>}
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="mt-2 rounded-lg px-3.5 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          {t("↪ Çıkış", "↪ Log out")}
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-forest-900 px-4 py-3 md:hidden">
          <Link to="/" className="font-display flex items-center gap-2 text-[17px] font-semibold text-white">
            <span className="grid size-7 place-items-center rounded-full bg-moss-500 text-forest-900">🌿</span>
            {t("Toprakla Yeniden", "Reconnect with Soil")}
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={t("Menü", "Menu")}
            aria-expanded={menuOpen}
            className="relative ml-auto grid size-9 place-items-center rounded-lg text-white transition hover:bg-white/10"
          >
            <span className="text-xl leading-none">{menuOpen ? "✕" : "☰"}</span>
            {!menuOpen && unread > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-clay-500" />}
          </button>
        </header>
        {/* Mobile dropdown menu: the full nav (everything in the sidebar), so no item is
            hidden behind a cut-off scroll bar. Closes on navigation. */}
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-b border-border bg-forest-900 p-3 md:hidden">
            {nav.map(item)}
            {adminNav.map(item)}
            <div className="mt-1 flex flex-col gap-1 border-t border-white/10 pt-2">
              {navBottom.map(item)}
            </div>
            <div className="mt-2 flex items-center gap-2.5 border-t border-white/10 pt-3">
              <div className="size-9 shrink-0 rounded-full bg-linear-135 from-moss-300 to-clay-500" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{user?.email?.split("@")[0] ?? t("Üye", "Member")}</div>
                {planBadge.text && <div className={cn("text-xs", planBadge.cls)}>{planBadge.text}</div>}
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="mt-1 rounded-lg px-3.5 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {t("↪ Çıkış", "↪ Log out")}
            </button>
          </nav>
        )}

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
