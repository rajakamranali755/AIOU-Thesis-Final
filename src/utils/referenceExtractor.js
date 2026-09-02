/**
 * referenceExtractor.js
 *
 * Lightweight, fully client-side automated-reference helper.
 * Scans chapter text for APA-style in-text citations (narrative and
 * parenthetical), then:
 *   1. Scaffolds APA reference-list entries for citations that are not yet
 *      present in the reference list (the author completes title/source).
 *   2. Cross-checks which detected citations already have a matching reference
 *      ("coverage"), so the author can see missing or orphaned entries.
 *
 * Nothing here changes how references render or export — it only produces
 * candidate strings that get appended to the existing references array.
 */
import { chapterBlocks } from "./chapterBlocks";
import { apaAuthorList } from "./apaName";

// Words that can look like an author before "(YYYY)" but are not citations.
const STOPWORDS = new Set([
  "In", "The", "This", "That", "These", "Those", "Their", "Our", "Its",
  "From", "During", "By", "A", "An", "As", "It", "We", "They", "Between",
  "Since", "After", "Before", "Although", "While", "However", "Figure",
  "Table", "Chapter", "Section", "Equation", "Appendix", "Both", "Each",
  "When", "Where", "Here", "There", "Such", "Using", "See", "And", "Or",
]);

// Reduce an author label ("Esteva et al.", "Smith & Jones") to its first surname.
function firstSurname(label) {
  const cleaned = (label || "")
    .replace(/\bet al\.?/gi, " ")
    .replace(/&/g, " ")
    .replace(/\band\b/gi, " ")
    .trim();
  const m = cleaned.match(/[A-Z][A-Za-z'’-]+/);
  return m ? m[0] : "";
}

function tidy(label) {
  return (label || "").replace(/\s+/g, " ").replace(/[.,;]+$/, "").trim();
}

function addCitation(map, label, year, raw, context) {
  const surname = firstSurname(label);
  if (!surname || surname.length < 2 || STOPWORDS.has(surname)) return;
  const key = surname.toLowerCase() + "|" + year;
  if (!map.has(key)) {
    map.set(key, { key, label: tidy(label), surname, year: String(year), raw: tidy(raw), context: tidy(context) });
  }
}

/** Concatenate all narrative text contained in the chapters. */
export function gatherChapterText(chapters = []) {
  const parts = [];
  for (const ch of chapters || []) {
    if (ch.title) parts.push(ch.title);
    for (const b of chapterBlocks(ch)) {
      if (b.type === "text" && b.content) parts.push(b.content);
      else if (b.type === "figure") { if (b.caption) parts.push(b.caption); if (b.description) parts.push(b.description); }
      else if (b.type === "table" && b.caption) parts.push(b.caption);
    }
    for (const sec of ch.sections || []) {
      if (sec.heading) parts.push(sec.heading);
      if (sec.content) parts.push(sec.content);
      for (const sub of sec.subsections || []) {
        if (sub.heading) parts.push(sub.heading);
        if (sub.content) parts.push(sub.content);
      }
    }
  }
  return parts.join("\n\n");
}

/** Extract the sentence surrounding a character index — the "source text". */
function sentenceAround(text, index) {
  const before = text.slice(0, index);
  const start = Math.max(
    before.lastIndexOf("."), before.lastIndexOf("\n"),
    before.lastIndexOf("!"), before.lastIndexOf("?")
  );
  const rest = text.slice(index);
  const nextRel = rest.search(/[.!?\n]/);
  const end = nextRel === -1 ? text.length : index + nextRel + 1;
  return text.slice(start + 1, end).replace(/\s+/g, " ").trim();
}

/**
 * Find unique APA in-text citations within a block of text.
 * Returns a sorted array of { key, label, surname, year, raw }.
 */
export function findInTextCitations(text = "") {
  const found = new Map();

  // Narrative: "Esteva et al. (2017)", "Smith and Jones (2019)", "Lee (2020)"
  const narrative =
    /([A-Z][A-Za-z'’-]+(?:\s+(?:and|&)\s+[A-Z][A-Za-z'’-]+|\s+et\s+al\.?)?)\s+\((\d{4}[a-z]?)\)/g;
  let m;
  while ((m = narrative.exec(text)) !== null) {
    addCitation(found, m[1], m[2], m[0], sentenceAround(text, m.index));
  }

  // Parenthetical: "(Esteva et al., 2017)", "(Smith & Jones, 2019; Lee, 2020)"
  const paren = /\(([^()]*\d{4}[a-z]?[^()]*)\)/g;
  while ((m = paren.exec(text)) !== null) {
    for (const seg of m[1].split(";")) {
      const cm = seg.match(/([A-Za-z'’.&\- ]+?),\s*(\d{4}[a-z]?)/);
      if (cm) addCitation(found, cm[1], cm[2], `(${seg.trim()})`, sentenceAround(text, m.index));
    }
  }

  return [...found.values()].sort(
    (a, b) => a.surname.localeCompare(b.surname) || a.year.localeCompare(b.year)
  );
}

/** Heuristic: does an existing reference string correspond to a citation? */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function surnameRegex(surname) {
  const sur = String(surname).toLowerCase().trim();
  // Match the surname as a whole word so "He" doesn't match inside "the".
  return new RegExp(`(^|[^a-z])${escapeRe(sur)}([^a-z]|$)`);
}

export function referenceMatchesCitation(refText, cit) {
  if (!refText) return false;
  const lower = refText.toLowerCase();
  const yr = String(cit.year).replace(/[a-z]$/, "");
  if (!lower.includes(yr)) return false;
  return surnameRegex(cit.surname).test(lower);
}

/** Build a clean reference-list entry from a detected in-text citation. */
export function buildReference(cit) {
  const authors = /et al\.?/i.test(cit.label) ? `${cit.surname} et al.` : cit.label;
  return `${authors} (${cit.year}).`;
}

/** Format an OpenAlex work into an APA-style reference string ending in a link. */
function formatWork(w) {
  const authors = (w.authorships || []).map((a) => a.author?.display_name).filter(Boolean);
  // APA 7th: every author "Surname, F. M." joined with commas and an ampersand.
  const authorStr = authors.length ? apaAuthorList(authors) : "Unknown author";
  const year = w.publication_year || "n.d.";
  const title = w.title || w.display_name || "Untitled";
  const venue =
    w.primary_location?.source?.display_name ||
    w.best_oa_location?.source?.display_name || "";
  const link =
    w.doi ||
    w.best_oa_location?.pdf_url ||
    w.open_access?.oa_url ||
    w.primary_location?.landing_page_url ||
    w.id;
  let ref = `${authorStr} (${year}). ${title}.`;
  if (venue) ref += ` ${venue}.`;
  if (link) ref += ` Retrieved from ${link}`;
  return ref;
}

/**
 * Look up a single detected citation against the OpenAlex index and return a
 * real, formatted reference (with a link) when a confident match is found.
 */
const OA_MAILTO = "wajahatmirza040@gmail.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Run an async worker over items with a bounded number of parallel requests,
// preserving result order and reporting progress as each finishes.
async function mapWithConcurrency(items, limit, worker, onProgress) {
  const results = new Array(items.length);
  let next = 0, done = 0;
  async function runner() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
      done++;
      if (onProgress) onProgress(done, items.length);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, runner)
  );
  return results;
}

// Fetch JSON from OpenAlex with a hard timeout and a short, fast backoff on
// transient throttling (429/5xx). Kept deliberately impatient: OpenAlex 503s
// are common under load, and long retry chains are what made reference-building
// feel like it hung. We fail fast to a placeholder rather than stall the UI.
async function fetchJsonWithRetry(url, retries = 1, timeoutMs = 7000) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 429 || res.status === 503 || res.status === 502 || res.status === 504) {
        lastErr = new Error(`HTTP ${res.status}`);
        if (attempt < retries) { await sleep(400 * (attempt + 1)); continue; }
        throw lastErr;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      const transient = e.name === "AbortError" || /Failed to fetch|NetworkError|HTTP (5\d\d|429)/i.test(e.message);
      if (attempt < retries && transient) { await sleep(400 * (attempt + 1)); continue; }
      throw e;
    }
  }
  throw lastErr || new Error("lookup failed");
}

export async function lookupReferenceOnline(cit) {
  const yearClean = String(cit.year).replace(/[a-z]$/, "");
  // Search by the author surname and constrain the year with a filter (putting
  // the year in the search text buries the real paper under others that merely
  // mention that year). Then require a genuine author-surname match — never fall
  // back to an unrelated paper, which would produce a wrong reference.
  // Filter by AUTHOR name + year (precise) rather than searching the surname as
  // free text — a free-text search for a common surname ("Brown", "Smith")
  // surfaces papers that merely use the word, not papers that author wrote, so
  // genuine references were missed. We still verify the surname on the result.
  const url =
    "https://api.openalex.org/works" +
    `?filter=raw_author_name.search:${encodeURIComponent(cit.surname)}` +
    `,publication_year:${yearClean}` +
    "&per-page=10" +
    `&mailto=${OA_MAILTO}`;
  try {
    const json = await fetchJsonWithRetry(url);
    const reSur = surnameRegex(cit.surname);
    const match = (json.results || []).find((w) =>
      (w.authorships || []).some((a) => reSur.test((a.author?.display_name || "").toLowerCase()))
    );
    if (!match) return { found: false, citation: cit, ref: null };
    return { found: true, citation: cit, ref: formatWork(match) };
  } catch (e) {
    return { found: false, citation: cit, ref: null, error: e.message };
  }
}

/** Look up many citations in parallel (bounded), reporting progress. */
export async function buildBibliographyOnline(citations, onProgress) {
  return mapWithConcurrency(citations, 5, (cit) => lookupReferenceOnline(cit), onProgress);
}

/* ────────────────────────────────────────────────────────────────────────────
   SOURCE DETECTION — given pasted/copied text, search the scholarly index for
   the passages and create references for the sources that match.
   Note: this can only find sources OpenAlex has indexed (open-access papers,
   abstracts, some full text). It can't trace arbitrary web pages or books.
   ──────────────────────────────────────────────────────────────────────────── */
const STOP = new Set(
  "the of and to in a is for that with as are on by an be this it from at or which has have was were can will not but their these those there here we our its also into than then so such may more most many using used based study results research paper article method methods data model models approach paper section figure table".split(" ")
);

function reconstructAbstract(inv) {
  if (!inv) return "";
  const slots = [];
  for (const [word, positions] of Object.entries(inv)) for (const p of positions) slots[p] = word;
  return slots.join(" ");
}

function distinctiveWords(text) {
  return [...new Set((text.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []).filter((w) => !STOP.has(w)))];
}

/** Pull the most distinctive sentences out of a block of text (likely copied passages). */
export function extractCandidatePassages(text, max = 12) {
  const sentences = (text.match(/[^.!?\n]+[.!?]?/g) || [])
    .map((s) => s.trim())
    .filter((s) => {
      const wc = s.split(/\s+/).length;
      return wc >= 10 && wc <= 60;
    });
  sentences.sort((a, b) => b.length - a.length); // longer = more distinctive
  const seen = new Set();
  const out = [];
  for (const s of sentences) {
    const k = s.slice(0, 40).toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Search the scholarly index for each distinctive passage and return the works
 * whose title/abstract strongly overlap the passage — i.e. likely sources of
 * copied text. Reports progress(scanned, total).
 */
export async function detectSourcesFromText(text, onProgress) {
  const passages = extractCandidatePassages(text, 6); // fewer passages → faster
  let errored = 0;
  const findings = await mapWithConcurrency(passages, 4, async (passage) => {
    const url =
      "https://api.openalex.org/works" +
      `?search=${encodeURIComponent(passage.slice(0, 350))}` +
      "&per-page=3" +
      `&mailto=${OA_MAILTO}`;
    try {
      const json = await fetchJsonWithRetry(url);
      const passWords = distinctiveWords(passage);
      if (passWords.length < 4) return null;
      let best = null, bestHits = 0;
      for (const w of json.results || []) {
        const hay = ((w.title || w.display_name || "") + " " + reconstructAbstract(w.abstract_inverted_index)).toLowerCase();
        const hits = passWords.filter((x) => hay.includes(x)).length;
        const ratio = hits / passWords.length;
        if (hits > bestHits && (ratio >= 0.5 || hits >= 6)) { best = w; bestHits = hits; }
      }
      return best ? { work: best, ref: formatWork(best), passage, confidence: bestHits } : null;
    } catch {
      errored++;
      return null;
    }
  }, onProgress);

  const sourcesById = new Map();
  for (const f of findings) {
    if (f && !sourcesById.has(f.work.id)) sourcesById.set(f.work.id, f);
  }
  return { scanned: passages.length, errored, sources: [...sourcesById.values()] };
}

/**
 * Main entry point.
 * Returns:
 *   citations   – all unique in-text citations detected
 *   present     – citations that already have a matching reference
 *   suggestions – citations with no matching reference (candidates to add)
 *   newRefs      – ready-to-append reference strings for the suggestions
 *   orphans      – existing references that match no in-text citation
 */
export function autoDetectReferences(chapters = [], existingRefs = []) {
  const text = gatherChapterText(chapters);
  const citations = findInTextCitations(text);

  const present = [];
  const suggestions = [];
  for (const cit of citations) {
    const has = (existingRefs || []).some((r) => referenceMatchesCitation(r, cit));
    (has ? present : suggestions).push(cit);
  }

  const newRefs = suggestions.map(buildReference);

  const orphans = (existingRefs || []).filter(
    (r) => r && r.trim() && !citations.some((c) => referenceMatchesCitation(r, c))
  );

  return { citations, present, suggestions, newRefs, orphans };
}
