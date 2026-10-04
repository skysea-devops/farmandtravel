// Lightweight local profanity/abuse filter. Runs in-process (closed VPC, no external
// moderation API). It's a safety net, not a judge — anything it flags goes to a human
// admin, so a false positive costs only an extra approval click. A false NEGATIVE is
// fine too: low-rated reviews are held regardless.
//
// Matching is TOKEN-based (not a global substring search), because stripping spaces and
// scanning for substrings flagged innocent English words ("picnic"/"pictures"/"typical"
// all contain "pic"). We split into words first, so a root only matches a real word.

const TR_MAP: Record<string, string> = { "ı": "i", "ş": "s", "ğ": "g", "ü": "u", "ö": "o", "ç": "c" };

// Normalize a single token: lowercase (tr-aware), de-leet, fold Turkish letters, drop
// non-letters, collapse 3+ repeats ("siiik" -> "sik").
function normToken(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/[ışğüöç]/g, (ch) => TR_MAP[ch] ?? ch)
    .replace(/[@4]/g, "a")
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1{2,}/g, "$1");
}

// Short roots that are substrings of innocent words ("pic"->picnic, "mal"->normal,
// "oc", "meme"). Flagged ONLY when a whole word normalizes exactly to them. "mal" stays
// exact-only on purpose: in a farming community it usually means livestock/goods, so the
// direct-insult inflections ("malsın/malsınız") are listed explicitly instead.
const EXACT_ONLY = new Set(["pic", "mal", "malsin", "malsiniz", "oc", "meme", "aptal", "salak"]);

// Longer roots: flagged when a word equals them or starts with them (handles Turkish
// suffix inflection: "siktirgit", "orospunun", "fucking"). Chosen to be specific enough
// that they're not prefixes of common innocent words.
const PREFIX_ROOTS = [
  "amk", "amq", "amcik", "amcig", "orospu", "orosbu", "yavsak", "gavat", "pezevenk",
  "kahpe", "sikeyim", "sikik", "siktir", "sikim", "siktigim", "gotveren", "gotten",
  "ibne", "ipne", "yarrak", "yarak", "tasak", "amina", "anani", "anasini", "serefsiz",
  "piczade", "gerizekali",
  "fuck", "fuk", "shit", "bitch", "asshole", "bastard", "dick", "cunt", "pussy",
  "slut", "whore", "faggot", "nigger", "retard", "motherfucker", "bollocks",
];

// Strongest, unambiguous terms — also caught in a space-stripped pass so that writing
// them without spaces to dodge tokenization still trips the filter. Kept to roots that
// are not substrings of ordinary words.
const STRONG = [
  "orospu", "siktir", "pezevenk", "yarrak", "aminakoy", "ananisikeyim",
  "motherfucker", "nigger", "faggot",
];

export function isProfane(text: string | null | undefined): boolean {
  if (!text) return false;

  const tokens = text.split(/[^A-Za-z0-9ışğüöçİIŞĞÜÖÇ@!|]+/u).map(normToken).filter(Boolean);
  for (const tk of tokens) {
    if (EXACT_ONLY.has(tk)) return true;
    for (const r of PREFIX_ROOTS) if (tk === r || tk.startsWith(r)) return true;
  }

  // Space-stripping evasion: scan the whole normalized string for the strongest roots.
  const glued = normToken(text);
  for (const r of STRONG) if (glued.includes(r)) return true;

  return false;
}
