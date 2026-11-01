import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Password field with a show/hide toggle. Drop-in replacement for a text <input>.
export function PasswordInput({ className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...rest}
        type={show ? "text" : "password"}
        className={`w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 pr-11 text-sm outline-none focus:border-forest-600 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
        className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded text-ink-500 hover:text-ink-900"
      >
        {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}
