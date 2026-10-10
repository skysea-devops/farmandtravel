import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/lib/i18n";

export type MapCategory = "host" | "volunteer" | "other";
export interface MapPin {
  id: string;
  name: string;
  city: string | null;
  category: MapCategory;
  lat: number;
  lng: number;
}

// host = çiftlik/yer sahibi (yeşil), volunteer = gönüllü (turuncu), other = diğer (gri)
const COLORS: Record<MapCategory, string> = { host: "#3a7d44", volunteer: "#e08a3c", other: "#9a9a90" };

function pinIcon(category: MapCategory) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:20px;height:20px;border-radius:50% 50% 50% 0;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg);background:${COLORS[category]}"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
}

// Real OpenStreetMap map with member pins. Clicking a pin calls onPinClick(id)
// (the page decides: guests get the join prompt, members go to the profile).
function MembersMap({ pins, onPinClick }: { pins: MapPin[]; onPinClick: (id: string) => void }) {
  const { t } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Init once.
  useEffect(() => {
    if (!boxRef.current || mapRef.current) return;
    const map = L.map(boxRef.current, { scrollWheelZoom: false, attributionControl: true }).setView([41, 20], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: ["a", "b", "c"],
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redraw markers when pins change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!pins.length) return;
    const latlngs: L.LatLngExpression[] = [];
    for (const p of pins) {
      const m = L.marker([p.lat, p.lng], { icon: pinIcon(p.category) })
        .bindTooltip(`${p.name}${p.city ? " · " + p.city : ""}`, { direction: "top", offset: [0, -18] })
        .on("click", () => onPinClick(p.id));
      layer.addLayer(m);
      latlngs.push([p.lat, p.lng]);
    }
    map.fitBounds(L.latLngBounds(latlngs).pad(0.25), { maxZoom: 7 });
  }, [pins, onPinClick]);

  const locate = () => mapRef.current?.locate({ setView: true, maxZoom: 9 });

  return (
    <div className="relative h-[720px] overflow-hidden rounded-[var(--radius-lg)] border border-border">
      <div ref={boxRef} className="h-full w-full" />
      <button onClick={locate}
        className="absolute top-3.5 right-3.5 z-[500] rounded-full border border-border bg-white/95 px-3.5 py-2 text-[13px] font-semibold text-forest-700 shadow-sm">
        {t("📍 Konumuma git", "📍 Go to my location")}
      </button>
      <div className="absolute bottom-3.5 left-3.5 z-[500] rounded-xl border border-border bg-white/95 px-3 py-2.5 text-[12.5px] shadow-sm">
        <div className="my-0.5 flex items-center gap-2"><span className="size-3 rounded-full rounded-bl-none" style={{ background: COLORS.host, transform: "rotate(-45deg)" }} /> {t("Çiftlik / yer sahipleri", "Farm / place owners")}</div>
        <div className="my-0.5 flex items-center gap-2"><span className="size-3 rounded-full rounded-bl-none" style={{ background: COLORS.volunteer, transform: "rotate(-45deg)" }} /> {t("Gönüllüler", "Volunteers")}</div>
        <div className="my-0.5 flex items-center gap-2"><span className="size-3 rounded-full rounded-bl-none" style={{ background: COLORS.other, transform: "rotate(-45deg)" }} /> {t("Öğrenen & destekçiler", "Learners & supporters")}</div>
      </div>
    </div>
  );
}

export default MembersMap;
