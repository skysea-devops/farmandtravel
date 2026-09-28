import { useEffect, useState } from "react";

// Stepped carousel for the "life on the farm" band. A row of photo cards slides one
// step every few seconds (not a continuous scroll), looping seamlessly. Each card
// shows the FULL photo (object-contain) over a blurred fill of itself, so portrait
// and landscape photos both sit properly without cropping faces.
const CARD_W = "clamp(240px,30vw,380px)";

export function BandSlider({ images, intervalMs = 3800 }: { images: string[]; intervalMs?: number }) {
  const loop = [...images, ...images];
  const [i, setI] = useState(0);
  const [anim, setAnim] = useState(true);

  useEffect(() => {
    if (images.length < 2) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setI((v) => v + 1), intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  // Seamless loop: after stepping onto the duplicated set, jump back to 0 without a
  // transition, then re-enable it on the next frame.
  useEffect(() => {
    if (i === images.length) {
      const t = setTimeout(() => { setAnim(false); setI(0); }, 750);
      return () => clearTimeout(t);
    }
    if (!anim) {
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
      return () => cancelAnimationFrame(r);
    }
  }, [i, images.length, anim]);

  return (
    <div className="absolute inset-0 -z-0 overflow-hidden bg-forest-900">
      <div
        className="flex h-full"
        style={{
          width: "max-content",
          transform: `translateX(calc(${CARD_W} * ${-i}))`,
          transition: anim ? "transform 0.7s ease" : "none",
        }}
      >
        {loop.map((src, idx) => (
          <div key={idx} className="relative h-full shrink-0 overflow-hidden" style={{ width: CARD_W }} aria-hidden="true">
            <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-xl" style={{ backgroundImage: `url(${src})` }} />
            <img src={src} alt="" className="relative h-full w-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}
