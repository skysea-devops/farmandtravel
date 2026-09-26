import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "onDark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-forest-600 text-white hover:bg-forest-700 border border-transparent",
  outline: "bg-transparent text-forest-700 border border-border-strong hover:bg-sand-100",
  ghost: "bg-transparent text-forest-700 border border-transparent hover:bg-sand-100",
  onDark: "bg-transparent text-white border border-white/50 hover:bg-white/10",
};
const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-[13px]",
  md: "px-[18px] py-2.5 text-sm",
  lg: "px-6 py-3 text-[15px]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...rest }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition cursor-pointer disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  );
}
