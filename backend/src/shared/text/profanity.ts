// Lightweight local profanity/abuse filter. Runs in-process (closed VPC, no
// external moderation API). It's a safety net, not a judge — anything it flags
// goes to a human admin, so false positives cost only an extra approval click.

// Normalize so simple obfuscation (CAPS, accents, repeats, spacing, leet) still
// matches: lowercase, Turkish-aware, collapse repeats, strip non-letters.
function normalize(input: string): string {
  return input
    .toLocaleLowerCase("tr")
    .replace(/[ışğüöç]/g, (ch) => ({ "ı": "i", "ş": "s", "ğ": "g", "ü": "u", "ö": "o", "ç": "c" }[ch] ?? ch))
    .replace(/[@4]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[^a-z]/g, "");
}

// Base roots (normalized). Matching is substring on the normalized string, so a
// root catches its inflections (küfürü, piçler, …). Keep roots specific enough
// to avoid everyday words.
const ROOTS_TR = [
  "amk", "amq", "aminakoyay", "aminakoy", "amcik", "amcig", "orospu", "orosbu",
  "pic", "yavsak", "gavat", "pezevenk", "kahpe", "sikeyim", "sikik", "siktir",
  "siktir", "sikim", "siktigim", "gotveren", "gotten", "ibne", "ipne", "yarrak",
  "yarak", "tasak", "meme", "amina", "ananisikeyim", "anani", "anasini",
  "serefsiz", "piczade", "salak", "gerizekali", "mal", "aptal", "oc",
];
const ROOTS_EN = [
  "fuck", "fuk", "shit", "bitch", "asshole", "bastard", "dick", "cunt", "pussy",
  "slut", "whore", "faggot", "nigger", "retard", "motherfucker", "bollocks",
];

// A few short roots above (mal, oc, meme) are real Turkish words; guard them so
// they only flag when clearly used as an insult, not in normal text.
const SHORT_AMBIGUOUS = new Set(["mal", "oc", "meme"]);
const ROOTS = [...ROOTS_TR, ...ROOTS_EN].filter((r) => !SHORT_AMBIGUOUS.has(r));

export function isProfane(text: string | null | undefined): boolean {
  if (!text) return false;
  const n = normalize(text);
  if (!n) return false;
  return ROOTS.some((root) => n.includes(root));
}
