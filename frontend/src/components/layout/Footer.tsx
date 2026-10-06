import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const brand = t("Toprakla Yeniden", "Reconnect with Soil");
  const domain = t("topraklayeniden.com", "reconnectwithsoil.com");
  return (
    <footer className="bg-forest-900 px-6 py-8 text-center text-[13px] text-moss-300">
      <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <Link to="/hakkimizda" className="transition hover:text-white">{t("Biz kimiz", "About us")}</Link>
        <span className="text-moss-300/40">·</span>
        <Link to="/kurallar" className="transition hover:text-white">{t("Topluluk Kuralları", "Community Rules")}</Link>
      </nav>
      {brand} · {domain} · © 2026
    </footer>
  );
}
