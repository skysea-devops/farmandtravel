// Post-build: generate dist/index.en.html from the built dist/index.html, swapping the
// static <head> metadata to English. Social scrapers (WhatsApp, Facebook, X, …) don't run
// JS, so the hostname-based runtime i18n can't fix the share preview — the English domain
// needs its own HTML with English <title>/lang/Open-Graph tags. A CloudFront Function
// serves this file for reconnectwithsoil.com page requests. Asset references are copied
// verbatim from the built index.html, so the hashed bundle names stay correct.
import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("../dist/index.html", import.meta.url);
const out = new URL("../dist/index.en.html", import.meta.url);

const EN_DESC = "Reconnect with Soil — a community bringing together people who believe in nature, sustainable living, and growing things together.";
const EN_OG_DESC = "A community connecting people who want to return to the land with those ready to open their doors.";

let html = readFileSync(src, "utf8");
html = html
  .replace('<html lang="tr">', '<html lang="en">')
  .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${EN_DESC}" />`)
  .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, '<meta property="og:title" content="Reconnect with Soil" />')
  .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${EN_OG_DESC}" />`)
  .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, '<meta property="og:url" content="https://reconnectwithsoil.com/" />')
  .replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, '<meta property="og:image" content="https://reconnectwithsoil.com/og-en.jpg" />')
  .replace(/<title>[^<]*<\/title>/, "<title>Reconnect with Soil</title>");

writeFileSync(out, html);
console.log("Generated dist/index.en.html (English Open Graph / title / lang)");
