// Continuous marquee for the "life on the farm" band: a row of photo cards sliding
// slowly and endlessly to the left. Each card shows the FULL photo (object-contain)
// over a blurred fill of itself, so portrait and landscape photos both sit properly
// without cropping faces. Duplicating the list lets the -50% translate loop seamlessly.
const CARD_W = "clamp(240px,30vw,380px)";

export function BandSlider({ images }: { images: string[] }) {
  const loop = [...images, ...images];
  return (
    <div className="absolute inset-0 -z-0 overflow-hidden bg-forest-900">
      <div className="band-track flex h-full w-max">
        {loop.map((src, idx) => (
          <div key={idx} className="relative h-full shrink-0 overflow-hidden" style={{ width: CARD_W }} aria-hidden="true">
            <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-xl" style={{ backgroundImage: `url(${src})` }} />
            <img src={src} alt="" className="relative h-full w-full object-contain" />
          </div>
        ))}
      </div>
      <style>{`
        .band-track { animation: band-marquee 80s linear infinite; }
        @keyframes band-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .band-track { animation: none; } }
      `}</style>
    </div>
  );
}
