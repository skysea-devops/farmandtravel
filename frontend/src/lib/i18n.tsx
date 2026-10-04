import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setApiLang } from "@/lib/api";

// Two markets, one codebase:
//   topraklayeniden.com   -> Turkish, TR pricing
//   reconnectwithsoil.com -> English, international pricing
// The domain decides the language (forced), so a foreign visitor always gets English.
// localhost/other falls back to a stored choice, else Turkish.

export type Lang = "tr" | "en";
export type Market = "tr" | "intl";

function detectLang(): Lang {
  if (typeof window === "undefined") return "tr";
  const h = window.location.hostname.toLowerCase();
  if (/(^|\.)reconnectwithsoil\.com$/.test(h)) return "en";
  if (/(^|\.)topraklayeniden\.com$/.test(h)) return "tr";
  try {
    const s = localStorage.getItem("ty:lang");
    if (s === "en" || s === "tr") return s;
  } catch { /* ignore */ }
  return "tr";
}

interface I18nCtx {
  lang: Lang;
  market: Market;
  setLang: (l: Lang) => void;
  /** Pick the string for the active language: t("Türkçe", "English"). */
  t: (tr: string, en: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "en" ? "Reconnect with Soil" : "Toprakla Yeniden";
    setApiLang(lang); // backend machine-translates content for the English site
  }, [lang]);

  const value = useMemo<I18nCtx>(() => ({
    lang,
    market: lang === "en" ? "intl" : "tr",
    setLang: (l) => {
      try { localStorage.setItem("ty:lang", l); } catch { /* ignore */ }
      setLangState(l);
    },
    t: (tr, en) => (lang === "en" ? en : tr),
  }), [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within LangProvider");
  return c;
}

// Convenience: const t = useT();  t("Merhaba", "Hello")
export const useT = () => useI18n().t;
