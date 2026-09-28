import { useEffect, useState } from "react";

// Auto-rotating crossfade background for the "life on the farm" band. All images are
// stacked; only the active one is opaque. Pauses nothing, respects reduced motion.
export function BandSlider({ images, intervalMs = 4500 }: { images: string[]; intervalMs?: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % images.length), intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <div className="absolute inset-0 -z-0">
      {images.map((src, idx) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${src})`, opacity: idx === i ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
