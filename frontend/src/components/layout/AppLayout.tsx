import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { api, notifications as notifApi } from "@/lib/api";
import type { Profile } from "@/lib/types";

const nav = [
  { to: "/app", label: "Panel", icon: "🏠", end: true },
  { to: "/app/kesfet", label: "Keşfet", icon: "🔍" },
  { to: "/app/baglantilar", label: "Bağlantılar", icon: "🤝" },
  { to: "/app/mesajlar", label: "Mesajlar", icon: "💬" },
  { to: "/app/kaydedilenler", label: "Kaydedilenler", icon: "🔖" },
  { to: "/app/bildirimler", label: "Bildirimler", icon: "🔔" },
  { to: "/app/profil", label: "Profilim", icon: "👤" },
];
const navBottom = [
  { to: "/app/abonelik", label: "Abonelik", icon: "💳" },
  { to: "/app/ayarlar", label: "Ayarlar", icon: "⚙️" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Refresh the bell badge on navigation (cheap, cached 30s).
  useEffect(() => {
    notifApi.unread<{ unread: number }>().then((r) => setUnread(r.unread)).catch(() => {});
  }, [location.pathname]);

  // Show the admin link only to admins.
  useEffect(() => {
    api.getCached<Profile>("/profile/me").then((p) => setIsAdmin(!!p.isAdmin)).catch(() => {});
  }, []);

  const adminNav: typeof nav = isAdmin ? [{ to: "/app/aktivite-onay", label: "Admin Panel", icon: "🛡️" }] : [];

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
          Toprakla Yeniden
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
            <div className="truncate text-sm font-semibold text-white">{user?.email?.split("@")[0] ?? "Üye"}</div>
            <div className="text-xs text-moss-300">● Üyelik aktif</div>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="mt-2 rounded-lg px-3.5 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          ↪ Çıkış
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-forest-900 px-4 py-3 md:hidden">
          <Link to="/" className="font-display flex items-center gap-2 text-[17px] font-semibold text-white">
            <span className="grid size-7 place-items-center rounded-full bg-moss-500 text-forest-900">🌿</span>
            Toprakla Yeniden
          </Link>
          <button onClick={() => { logout(); navigate("/"); }} className="ml-auto text-sm text-moss-100">Çıkış</button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 md:hidden">
          {[...nav, ...adminNav].map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn("whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium", isActive ? "bg-forest-600 text-white" : "text-ink-700 hover:bg-sand-100")}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
