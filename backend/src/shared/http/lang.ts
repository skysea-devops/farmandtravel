import type { Context } from "hono";

// Target language for the response, from the `x-lang` header the frontend sends based on
// the hostname (reconnectwithsoil.com -> en). Base language is Turkish; anything other
// than "en" means no translation.
export function reqLang(c: Context): string {
  return (c.req.header("x-lang") ?? "").toLowerCase() === "en" ? "en" : "tr";
}
