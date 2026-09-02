/**
 * citationBuilder.js
 * The fields each citation style asks for, per source type, and the rules that
 * turn a filled-in form into a full reference entry and an in-text citation.
 */

export const SOURCE_TYPES = [
  { id: "book", label: "Book" },
  { id: "journal", label: "Journal Article" },
  { id: "chapter", label: "Chapter in an Edited Book" },
  { id: "website", label: "Website" },
  { id: "thesis", label: "Thesis / Dissertation" },
  { id: "conference", label: "Conference Paper" },
];

const F = (id, label, opts = {}) => ({ id, label, ...opts });

// Field order matters — it is the order the form shows them in.
const FIELDS = {
  APA7: {
    book:       [F("year", "Year", { req: true }), F("title", "Title", { req: true }), F("publisher", "Publisher", { req: true }), F("edition", "Edition"), F("pages", "Page(s)", { ph: "1-2, A1, ii-xi" }), F("doi", "DOI"), F("url", "URL")],
    journal:    [F("year", "Year", { req: true }), F("title", "Article Title", { req: true }), F("journal", "Journal Title", { req: true }), F("volume", "Volume"), F("issue", "Issue"), F("pages", "Page(s)", { ph: "1-2, A1, ii-xi" }), F("doi", "DOI"), F("url", "URL")],
    chapter:    [F("year", "Year", { req: true }), F("title", "Chapter Title", { req: true }), F("bookTitle", "Book Title", { req: true }), F("editors", "Editor(s)"), F("publisher", "Publisher", { req: true }), F("pages", "Page(s)"), F("doi", "DOI")],
    website:    [F("year", "Year", { req: true }), F("title", "Page Title", { req: true }), F("site", "Website Name"), F("url", "URL", { req: true }), F("accessed", "Date Accessed")],
    thesis:     [F("year", "Year", { req: true }), F("title", "Title", { req: true }), F("thesisType", "Type", { ph: "Doctoral dissertation" }), F("institution", "Institution", { req: true }), F("url", "URL")],
    conference: [F("year", "Year", { req: true }), F("title", "Paper Title", { req: true }), F("conference", "Conference Name", { req: true }), F("location", "Location"), F("doi", "DOI")],
  },
  MLA9: {
    book:       [F("title", "Title", { req: true }), F("publisher", "Publisher", { req: true }), F("year", "Year", { req: true }), F("edition", "Edition"), F("volume", "Volume"), F("city", "Publication City"), F("doi", "DOI"), F("pages", "Page(s)", { ph: "1-2, A1, ii-xi" })],
    journal:    [F("title", "Article Title", { req: true }), F("journal", "Journal Title", { req: true }), F("volume", "Volume"), F("issue", "Issue"), F("year", "Year", { req: true }), F("pages", "Page(s)"), F("doi", "DOI")],
    chapter:    [F("title", "Chapter Title", { req: true }), F("bookTitle", "Book Title", { req: true }), F("editors", "Editor(s)"), F("publisher", "Publisher", { req: true }), F("year", "Year", { req: true }), F("pages", "Page(s)")],
    website:    [F("title", "Page Title", { req: true }), F("site", "Website Name"), F("year", "Year", { req: true }), F("url", "URL", { req: true }), F("accessed", "Date Accessed")],
    thesis:     [F("title", "Title", { req: true }), F("thesisType", "Type", { ph: "PhD dissertation" }), F("institution", "Institution", { req: true }), F("year", "Year", { req: true })],
    conference: [F("title", "Paper Title", { req: true }), F("conference", "Conference Name", { req: true }), F("location", "Location"), F("year", "Year", { req: true })],
  },
  CHICAGO: {
    book:       [F("year", "Year", { req: true }), F("title", "Title", { req: true }), F("publisher", "Publisher", { req: true }), F("edition", "Edition"), F("city", "Publication City"), F("doi", "DOI"), F("url", "URL")],
    journal:    [F("year", "Year", { req: true }), F("title", "Article Title", { req: true }), F("journal", "Journal Title", { req: true }), F("volume", "Volume"), F("issue", "Issue"), F("pages", "Page(s)"), F("doi", "DOI")],
    chapter:    [F("year", "Year", { req: true }), F("title", "Chapter Title", { req: true }), F("bookTitle", "Book Title", { req: true }), F("editors", "Editor(s)"), F("city", "Publication City"), F("publisher", "Publisher", { req: true }), F("pages", "Page(s)")],
    website:    [F("year", "Year", { req: true }), F("title", "Page Title", { req: true }), F("site", "Website Name"), F("url", "URL", { req: true }), F("accessed", "Date Accessed")],
    thesis:     [F("year", "Year", { req: true }), F("title", "Title", { req: true }), F("thesisType", "Type", { ph: "PhD diss." }), F("institution", "Institution", { req: true })],
    conference: [F("year", "Year", { req: true }), F("title", "Paper Title", { req: true }), F("conference", "Conference Name", { req: true }), F("location", "Location")],
  },
  IEEE: {
    book:       [F("title", "Title", { req: true }), F("publisher", "Publisher", { req: true }), F("year", "Year", { req: true }), F("edition", "Edition"), F("city", "Publication City"), F("pages", "Page(s)")],
    journal:    [F("title", "Paper Title", { req: true }), F("journal", "Journal Title", { req: true }), F("volume", "Volume"), F("issue", "Issue"), F("pages", "Page(s)"), F("year", "Year", { req: true }), F("doi", "DOI")],
    chapter:    [F("title", "Chapter Title", { req: true }), F("bookTitle", "Book Title", { req: true }), F("publisher", "Publisher", { req: true }), F("year", "Year", { req: true }), F("pages", "Page(s)")],
    website:    [F("title", "Page Title", { req: true }), F("site", "Website Name"), F("url", "URL", { req: true }), F("accessed", "Date Accessed")],
    thesis:     [F("title", "Title", { req: true }), F("thesisType", "Type", { ph: "Ph.D. dissertation" }), F("institution", "Institution", { req: true }), F("year", "Year", { req: true })],
    conference: [F("title", "Paper Title", { req: true }), F("conference", "Conference Name", { req: true }), F("location", "Location"), F("year", "Year", { req: true }), F("pages", "Page(s)")],
  },
};

export function fieldsFor(styleId, sourceId) {
  const byStyle = FIELDS[styleId] || FIELDS.APA7;
  return byStyle[sourceId] || byStyle.book;
}

// ── contributor name formatting ─────────────────────────────────────────────
const initial = (s) => (s ? `${String(s).trim()[0].toUpperCase()}.` : "");

function nameFor(styleId, c, { first = false } = {}) {
  const last = (c.last || "").trim();
  const fn = (c.first || "").trim();
  const mid = initial(c.mid);
  const suffix = (c.suffix || "").trim();
  if (!last && !fn) return "";
  const sfx = suffix ? `, ${suffix}` : "";
  if (styleId === "IEEE") return `${initial(fn)}${mid ? ` ${mid}` : ""} ${last}${sfx}`.trim();
  if (styleId === "MLA9" || styleId === "CHICAGO") {
    // First contributor is inverted, the rest are in natural order.
    return first ? `${last}, ${fn}${mid ? ` ${mid}` : ""}${sfx}`.trim()
                 : `${fn}${mid ? ` ${mid}` : ""} ${last}${sfx}`.trim();
  }
  return `${last}, ${initial(fn)}${mid ? ` ${mid}` : ""}${sfx}`.trim(); // APA
}

export function contributorsString(styleId, list = []) {
  const names = list.map((c, i) => nameFor(styleId, c, { first: i === 0 })).filter(Boolean);
  if (!names.length) return "";
  if (styleId === "APA7") {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]}, & ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
  }
  if (styleId === "MLA9") {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]}, and ${names[1]}`;
    return `${names[0]}, et al.`;
  }
  if (styleId === "CHICAGO") {
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }
  // IEEE
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

// ── the full reference entry ────────────────────────────────────────────────
const j = (parts) => parts.filter(Boolean).join(" ").replace(/\s+([.,])/g, "$1").replace(/\s{2,}/g, " ").trim();
const dot = (s) => (s && !/[.!?]$/.test(s.trim()) ? `${s.trim()}.` : (s || "").trim());

export function formatFullCitation(styleId, sourceId, f = {}, contributors = []) {
  const who = contributorsString(styleId, contributors);
  const ed = f.edition ? `(${f.edition} ed.)` : "";
  const link = f.doi ? `https://doi.org/${String(f.doi).replace(/^https?:\/\/doi\.org\//, "")}` : (f.url || "");

  if (styleId === "APA7") {
    switch (sourceId) {
      case "journal": return j([dot(who), `(${f.year || "n.d."}).`, dot(f.title), `${f.journal || ""}${f.volume ? `, ${f.volume}` : ""}${f.issue ? `(${f.issue})` : ""}${f.pages ? `, ${f.pages}` : ""}.`, link]);
      case "chapter": return j([dot(who), `(${f.year || "n.d."}).`, dot(f.title), `In ${f.editors ? `${f.editors} (Ed.), ` : ""}${f.bookTitle || ""}${f.pages ? ` (pp. ${f.pages})` : ""}.`, dot(f.publisher), link]);
      case "website": return j([dot(who), `(${f.year || "n.d."}).`, dot(f.title), dot(f.site), f.url]);
      case "thesis": return j([dot(who), `(${f.year || "n.d."}).`, dot(f.title), `[${f.thesisType || "Doctoral dissertation"}, ${f.institution || ""}].`, f.url]);
      case "conference": return j([dot(who), `(${f.year || "n.d."}).`, dot(f.title), `${f.conference || ""}${f.location ? `, ${f.location}` : ""}.`, link]);
      default: return j([dot(who), `(${f.year || "n.d."}).`, dot(f.title), ed, dot(f.publisher), link]);
    }
  }
  if (styleId === "MLA9") {
    switch (sourceId) {
      case "journal": return j([dot(who), `"${dot(f.title)}"`, `${f.journal || ""},`, f.volume ? `vol. ${f.volume},` : "", f.issue ? `no. ${f.issue},` : "", `${f.year || ""},`, f.pages ? `pp. ${f.pages}.` : "", link]);
      case "chapter": return j([dot(who), `"${dot(f.title)}"`, `${f.bookTitle || ""},`, f.editors ? `edited by ${f.editors},` : "", `${f.publisher || ""}, ${f.year || ""},`, f.pages ? `pp. ${f.pages}.` : ""]);
      case "website": return j([dot(who), `"${dot(f.title)}"`, `${f.site || ""}, ${f.year || ""},`, f.url ? `${f.url}.` : "", f.accessed ? `Accessed ${f.accessed}.` : ""]);
      case "thesis": return j([dot(who), `${f.title || ""}.`, `${f.year || ""}. ${f.institution || ""},`, `${f.thesisType || "PhD dissertation"}.`]);
      case "conference": return j([dot(who), `"${dot(f.title)}"`, `${f.conference || ""},`, f.location ? `${f.location},` : "", `${f.year || ""}.`]);
      default: return j([dot(who), `${f.title || ""}.`, ed, `${f.city ? `${f.city}: ` : ""}${f.publisher || ""}, ${f.year || ""}.`, f.pages ? `pp. ${f.pages}.` : "", link]);
    }
  }
  if (styleId === "CHICAGO") {
    switch (sourceId) {
      case "journal": return j([dot(who), `${f.year || "n.d."}.`, `"${dot(f.title)}"`, `${f.journal || ""}`, f.volume ? `${f.volume}` : "", f.issue ? `(no. ${f.issue})` : "", f.pages ? `: ${f.pages}.` : ".", link]);
      case "chapter": return j([dot(who), `${f.year || "n.d."}.`, `"${dot(f.title)}"`, `In ${f.bookTitle || ""},`, f.editors ? `edited by ${f.editors},` : "", f.pages ? `${f.pages}.` : "", `${f.city ? `${f.city}: ` : ""}${dot(f.publisher)}`]);
      case "website": return j([dot(who), `${f.year || "n.d."}.`, `"${dot(f.title)}"`, dot(f.site), f.url ? `${f.url}.` : "", f.accessed ? `Accessed ${f.accessed}.` : ""]);
      case "thesis": return j([dot(who), `${f.year || "n.d."}.`, `"${dot(f.title)}"`, `${f.thesisType || "PhD diss."}, ${dot(f.institution)}`]);
      case "conference": return j([dot(who), `${f.year || "n.d."}.`, `"${dot(f.title)}"`, `Paper presented at ${f.conference || ""}${f.location ? `, ${f.location}` : ""}.`]);
      default: return j([dot(who), `${f.year || "n.d."}.`, `${f.title || ""}.`, ed, `${f.city ? `${f.city}: ` : ""}${dot(f.publisher)}`, link]);
    }
  }
  // IEEE
  switch (sourceId) {
    case "journal": return j([`${who},`, `"${f.title || ""},"`, `${f.journal || ""},`, f.volume ? `vol. ${f.volume},` : "", f.issue ? `no. ${f.issue},` : "", f.pages ? `pp. ${f.pages},` : "", `${f.year || ""}.`, link]);
    case "chapter": return j([`${who},`, `"${f.title || ""},"`, `in ${f.bookTitle || ""}.`, `${f.publisher || ""}, ${f.year || ""},`, f.pages ? `pp. ${f.pages}.` : ""]);
    case "website": return j([`${who},`, `"${f.title || ""},"`, `${f.site || ""}.`, f.url ? `[Online]. Available: ${f.url}.` : "", f.accessed ? `[Accessed: ${f.accessed}].` : ""]);
    case "thesis": return j([`${who},`, `"${f.title || ""},"`, `${f.thesisType || "Ph.D. dissertation"}, ${f.institution || ""}, ${f.year || ""}.`]);
    case "conference": return j([`${who},`, `"${f.title || ""},"`, `in ${f.conference || ""},`, f.location ? `${f.location},` : "", `${f.year || ""},`, f.pages ? `pp. ${f.pages}.` : ""]);
    default: return j([`${who},`, `${f.title || ""},`, ed, `${f.city ? `${f.city}: ` : ""}${f.publisher || ""}, ${f.year || ""}.`]);
  }
}

// ── the in-text citation ────────────────────────────────────────────────────
export function formatInTextCitation(styleId, f = {}, contributors = [], page = "") {
  const surnames = contributors.map(c => (c.last || "").trim()).filter(Boolean);
  const who = surnames.length === 0 ? ""
    : surnames.length === 1 ? surnames[0]
    : surnames.length === 2 ? (styleId === "APA7" ? `${surnames[0]} & ${surnames[1]}` : `${surnames[0]} and ${surnames[1]}`)
    : `${surnames[0]} et al.`;
  const pg = String(page || "").trim();
  if (styleId === "IEEE") return pg ? `[n, p. ${pg}]` : "[n]";
  if (styleId === "MLA9") return `(${[who, pg].filter(Boolean).join(" ")})`;
  if (styleId === "CHICAGO") return `(${[who, f.year || "n.d."].filter(Boolean).join(" ")}${pg ? `, ${pg}` : ""})`;
  return `(${[who, f.year || "n.d."].filter(Boolean).join(", ")}${pg ? `, p. ${pg}` : ""})`; // APA
}
