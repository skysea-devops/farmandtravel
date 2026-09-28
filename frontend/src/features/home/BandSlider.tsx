// Horizontal marquee for the "life on the farm" band: a row of photos (3–4 visible)
// sliding continuously to the left, looping seamlessly. Text overlay sits on top.
// Duplicating the list once lets the -50% translate loop without a visible jump.
export function BandSlider({ images }: { images: string[] }) {
  const loop = [...images, ...images];
  return (
    <div className="absolute inset-0 -z-0 overflow-hidden">
      <div className="band-track flex h-full w-max">
        {loop.map((src, i) => (
          <div
            key={i}
            className="h-full w-[clamp(220px,26vw,340px)] shrink-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${src})` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <style>{`
        .band-track { animation: band-marquee 45s linear infinite; }
        @keyframes band-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .band-track { animation: none; } }
      `}</style>
    </div>
  );
}
