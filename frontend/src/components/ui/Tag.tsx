import { cn } from "@/lib/cn";
import type { Axis } from "@/data/demo";

const styles: Record<string, string> = {
  offer: "bg-offer-bg text-offer border-[#c6e0c2]",
  seek: "bg-seek-bg text-seek border-[#c4dde5]",
  topic: "bg-sand-200 text-clay-600 border-sand-300",
  situation: "bg-[#efe6d6] text-[#8a5a24] border-[#e3d3ac]",
};

export function Tag({ axis, children }: { axis: Axis; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[axis] ?? styles.topic,
      )}
    >
      {children}
    </span>
  );
}
