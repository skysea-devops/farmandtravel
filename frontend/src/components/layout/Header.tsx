import { NavLink, Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

const links = [
  { to: "/", label: "Ana sayfa", end: true },
  { to: "/hakkimizda", label: "Biz kimiz" },
  { to: "/kesfet", label: "Keşfet" },
  { to: "/aktiviteler", label: "Aktiviteler" },
];

export function Header() {
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="container-x flex items-center gap-4 py-3.5">
        <Link to="/" className="font-display flex items-center gap-2 text-[21px] font-semibold">
          <span className="grid size-[30px] place-items-center rounded-full bg-moss-500 text-forest-900">🌿</span>
          Toprakla Yeniden
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
          <Button variant="ghost" size="sm" className="max-sm:hidden">Giriş yap</Button>
          <Button size="sm">Başla</Button>
        </div>
      </div>
    </nav>
  );
}
