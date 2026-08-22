/**
 * apaName.js — convert a person's name from (almost) any format to APA 7th
 * reference style, and join several authors into an APA author list.
 *
 *   "Andre Esteva"          -> "Esteva, A."
 *   "Andre M. Esteva"       -> "Esteva, A. M."
 *   "Esteva, Andre"         -> "Esteva, A."
 *   "Maria van der Berg"    -> "van der Berg, M."
 *   "John Smith Jr."        -> "Smith, J., Jr."
 *   "Madonna"               -> "Madonna"        (mononym kept as-is)
 */

// Lowercase surname particles that belong with the surname (e.g. "van der Berg").
const PARTICLES = new Set([
  "van", "von", "der", "den", "de", "del", "della", "da", "di", "du",
  "la", "le", "el", "al", "bin", "ibn", "abu", "mac", "mc", "st", "san", "santa",
]);
const SUFFIX_RE = /,?\s*(Jr\.?|Sr\.?|II|III|IV|V)\s*$/i;

function toInitials(givenTokens) {
  return givenTokens
    .flatMap(t => t.split("-"))                       // hyphenated given names → each initial
    .map(t => t.replace(/[^A-Za-z\u00C0-\u024F]/g, ""))
    .filter(Boolean)
    .map(t => t[0].toUpperCase() + ".")
    .join(" ");
}

export function toApaName(raw = "") {
  let name = String(raw).trim().replace(/\s+/g, " ");
  if (!name) return "";

  // Set aside a generational suffix (Jr., III …).
  let suffix = "";
  const sm = name.match(SUFFIX_RE);
  if (sm) {
    suffix = sm[1].replace(/\.$/, "");
    name = name.slice(0, sm.index).replace(/,\s*$/, "").trim();
  }

  let surname, given;
  if (name.includes(",")) {
    const [s, g] = name.split(",");
    surname = s.trim();
    given = (g || "").trim().split(" ").filter(Boolean);
  } else {
    const tokens = name.split(" ").filter(Boolean);
    if (tokens.length === 1) return suffix ? `${tokens[0]}, ${suffix}.` : tokens[0];
    let si = tokens.length - 1;                        // surname = last token …
    while (si - 1 >= 1 && PARTICLES.has(tokens[si - 1].toLowerCase())) si--; // … + leading particles
    surname = tokens.slice(si).join(" ");
    given = tokens.slice(0, si);
  }

  const inits = toInitials(given);
  let out = inits ? `${surname}, ${inits}` : surname;
  if (suffix) out += `, ${suffix}.`;
  return out;
}

/** Join names into an APA 7th author list ( &, and the 21+ ellipsis rule ). */
export function apaAuthorList(names = []) {
  const apa = names.map(toApaName).filter(Boolean);
  if (apa.length === 0) return "";
  if (apa.length === 1) return apa[0];
  if (apa.length <= 20) return apa.slice(0, -1).join(", ") + ", & " + apa[apa.length - 1];
  return apa.slice(0, 19).join(", ") + ", … " + apa[apa.length - 1]; // 21+ authors
}

/**
 * Convert the author portion of a typed reference to APA, conservatively.
 * "John Smith (2020). Title. Publisher."        -> "Smith, J. (2020). Title. Publisher."
 * "John Smith and Jane Doe (2019). ..."         -> "Smith, J., & Doe, J. (2019). ..."
 * Anything it can't parse safely (no year marker, or the author block already
 * contains a comma — i.e. likely already APA / surname-first) is returned
 * unchanged, so it never mangles a correct reference and is idempotent.
 */
export function apaifyReference(ref = "") {
  const s = String(ref).trim();
  if (!s) return s;
  const marker = s.match(/\(\s*(?:\d{4}[a-z]?|n\.d\.|in press)\s*\)/i);
  if (!marker) return s;                         // no "(year)" → don't guess
  const authorPart = s.slice(0, marker.index).trim().replace(/[.,;]\s*$/, "");
  const rest = s.slice(marker.index);            // "(year). …"
  if (!authorPart) return s;
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(authorPart)) return s; // Urdu/Arabic → leave it
  if (authorPart.includes(",")) return s;        // already APA / surname-first → leave it
  const names = authorPart.split(/\s*(?:&|\band\b)\s*/i).map(t => t.trim()).filter(Boolean);
  if (!names.length) return s;
  const apa = apaAuthorList(names);
  if (!apa) return s;
  return `${apa} ${rest}`;
}
