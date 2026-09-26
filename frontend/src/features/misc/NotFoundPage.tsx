import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="container-x flex flex-col items-start pt-24 pb-24">
      <div className="text-xs font-semibold tracking-wider text-forest-600">SAYFA YOK</div>
      <h1 className="font-display mt-3 text-4xl font-semibold">Bu tarla nadasta.</h1>
      <p className="mt-3 max-w-md text-ink-500">Bu adreste bir şey yetişmiyor. Geri dönüp bir yol seç.</p>
      <Link to="/" className="mt-8"><Button size="lg">Ana sayfaya dön</Button></Link>
    </div>
  );
}
