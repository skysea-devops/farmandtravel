import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="container-x flex flex-col items-start pt-24 pb-24">
      <div className="text-xs font-semibold tracking-wider text-forest-600">{t("SAYFA YOK", "PAGE NOT FOUND")}</div>
      <h1 className="font-display mt-3 text-4xl font-semibold">{t("Bu tarla nadasta.", "This field lies fallow.")}</h1>
      <p className="mt-3 max-w-md text-ink-500">{t("Bu adreste bir şey yetişmiyor. Geri dönüp bir yol seç.", "Nothing grows at this address. Head back and pick a path.")}</p>
      <Link to="/" className="mt-8"><Button size="lg">{t("Ana sayfaya dön", "Back to home")}</Button></Link>
    </div>
  );
}
