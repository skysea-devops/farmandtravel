import { useState } from "react";

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
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-base text-ink-500 hover:text-ink-900"
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}
