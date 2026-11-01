import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Clapperboard, Handshake, MessageCircle, Bookmark, Bell, User, CreditCard, ScrollText, Settings, Shield, Sprout, Circle, Menu, X, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api, notifications as notifApi } from "@/lib/api";
import type { Profile } from "@/lib/types";

type NavItem = { to: string; label: string; Icon: LucideIcon; end?: boolean };

export function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState<string>("");
  const [inReview, setInReview] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes (i.e. after tapping an item).
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const nav: NavItem[] = [
    { to: "/app", label: t("Panel", "Home"), Icon: Home, end: true },
    { to: "/app/kesfet", label: t("Keşfet", "Discover"), Icon: Search },
    { to: "/app/aktiviteler", label: t("Aktiviteler", "Activities"), Icon: Clapperboard },
    { to: "/app/baglantilar", label: t("Bağlantılar", "Connections"), Icon: Handshake },
    { to: "/app/mesajlar", label: t("Mesajlar", "Messages"), Icon: MessageCircle },
    { to: "/app/kaydedilenler", label: t("Kaydedilenler", "Saved"), Icon: Bookmark },
    { to: "/app/bildirimler", label: t("Bildirimler", "Notifications"), Icon: Bell },
    { to: "/app/profil", label: t("Profilim", "My profile"), Icon: User },
  ];
  const navBottom: NavItem[] = [
    { to: "/app/abonelik", label: t("Abonelik", "Membership"), Icon: CreditCard },
    { to: "/kurallar", label: t("Topluluk Kuralları", "Community Rules"), Icon: ScrollText },
    { to: "/app/ayarlar", label: t("Ayarlar", "Settings"), Icon: Settings },
  ];

  // Refresh the bell badge on navigation (cheap, cached 30s).
  useEffect(() => {
    notifApi.unread<{ unread: number }>().then((r) => setUnread(r.unread)).catch(() => {});
  }, [location.pathname]);

  // Load profile: admin link, plan badge, and bounce unfinished onboarding to /onboarding.
  // Adminler profil oluşturmaya zorlanmaz — doğrudan panele erişebilirler.
  useEffect(() => {
    api.getCached<Profile>("/profile/me")
      .then((p) => {
        setIsAdmin(!!p.isAdmin);
        setPlan(p.plan ?? "");
        // Profilini bitirmiş ama admin onayından geçmemiş → Keşfet'te görünmez (inceleme).
        setInReview((p.status === "profile_complete" || p.status === "active") && p.approved === false);
        if (p.status === "onboarding" && !p.isAdmin) navigate("/onboarding", { replace: true });
      })
      .catch(() => {});
  }, [navigate]);

  const planBadge: { Icon: LucideIcon | null; text: string; cls: string } =
    plan === "frontier" ? { Icon: Sprout, text: t("Öncü üye · ücretsiz", "Founding member · free"), cls: "text-moss-300" }
    : plan === "active" ? { Icon: Circle, text: t("Üyelik aktif", "Membership active"), cls: "text-moss-300" }
    : plan === "none" ? { Icon: null, text: t("Üyelik gerekli", "Membership required"), cls: "text-clay-300" }
    : { Icon: null, text: "", cls: "text-moss-300" };

  const adminNav: NavItem[] = isAdmin ? [{ to: "/app/aktivite-onay", label: t("Admin Panel", "Admin Panel"), Icon: Shield }] : [];

  const item = ({ to, label, Icon, end }: NavItem) => (
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
      <Icon className="size-[18px] shrink-0" strokeWidth={2} />
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
          <img src="/logo-mark.png" alt="" className="size-8 shrink-0 rounded-full bg-white object-contain p-1" />
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
            {planBadge.text && <div className={cn("flex items-center gap-1 text-xs", planBadge.cls)}>{planBadge.Icon && <planBadge.Icon className="size-3 shrink-0" fill={planBadge.Icon === Circle ? "currentColor" : "none"} />}{planBadge.text}</div>}
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="mt-2 flex items-center gap-2 rounded-lg px-3.5 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4 shrink-0" /> {t("Çıkış", "Log out")}
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-forest-900 px-4 py-3 md:hidden">
          <Link to="/" className="font-display flex items-center gap-2 text-[17px] font-semibold text-white">
            <img src="/logo-mark.png" alt="" className="size-7 shrink-0 rounded-full bg-white object-contain p-0.5" />
            {t("Toprakla Yeniden", "Reconnect with Soil")}
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={t("Menü", "Menu")}
            aria-expanded={menuOpen}
            className="relative ml-auto grid size-9 place-items-center rounded-lg text-white transition hover:bg-white/10"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
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
                {planBadge.text && <div className={cn("flex items-center gap-1 text-xs", planBadge.cls)}>{planBadge.Icon && <planBadge.Icon className="size-3 shrink-0" fill={planBadge.Icon === Circle ? "currentColor" : "none"} />}{planBadge.text}</div>}
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="mt-1 flex items-center gap-2 rounded-lg px-3.5 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4 shrink-0" /> {t("Çıkış", "Log out")}
            </button>
          </nav>
        )}

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
          {inReview && (
            <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-lg)] border-l-4 border-clay-500 bg-clay-500/10 px-4 py-3 text-sm text-ink-700">
              <span className="text-lg leading-none">⏳</span>
              <div>
                <b className="text-ink-900">{t("Profilin incelemede", "Your profile is under review")}</b>
                <p className="mt-0.5">
                  {t("Ekibimiz profilini kontrol ediyor. Onaylanınca Keşfet'te görünür ve diğer üyelerle eşleşmeye başlarsın. Bu sırada profilini düzenlemeye devam edebilirsin.",
                     "Our team is reviewing your profile. Once approved, you'll appear in Discover and start matching with other members. You can keep editing your profile in the meantime.")}
                </p>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
