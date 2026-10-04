import type { Context } from "hono";

// Target language for the response, from the `x-lang` header the frontend sends based on
// the hostname (reconnectwithsoil.com -> en). Base language is Turkish; anything other
// than "en" means no translation.
export function reqLang(c: Context): string {
  return (c.req.header("x-lang") ?? "").toLowerCase() === "en" ? "en" : "tr";
}

// The official account's brand name is market-specific (a proper noun, so auto-translation
// deliberately leaves it alone). Display it per language wherever the official account's
// name is shown.
export function brandName(lang: string): string {
  return lang === "en" ? "Reconnect with Soil" : "Toprakla Yeniden";
}
