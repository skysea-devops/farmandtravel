import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const brand = t("Toprakla Yeniden", "Reconnect with Soil");
  const domain = t("topraklayeniden.com", "reconnectwithsoil.com");
  return (
    <footer className="bg-forest-900 px-6 py-8 text-center text-[13px] text-moss-300">
      {brand} · {domain} · © 2026
    </footer>
  );
}
