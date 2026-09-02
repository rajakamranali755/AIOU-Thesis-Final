/**
 * citationStyles.js
 * The four citation styles the scholar can choose from. Choosing a style
 * automatically applies that style's own rules to the reference list —
 * entry order, numbering, indentation and line spacing — in the preview,
 * the PDF, the Word file and Print. The list heading is always REFERENCES.
 */
export const CITATION_STYLES = {
  APA7: {
    id: "APA7",
    label: "APA 7th",
    note: "Alphabetical by author · hanging indent · no numbering",
    numbered: false,
    alphabetical: true,
    hangingIndent: true,
    lineHeight: 2.0,      // APA reference lists are double spaced
    spaceBetween: 0,
    example: "Author, A. A. (2024). Title of the work. Publisher.",
  },
  MLA9: {
    id: "MLA9",
    label: "MLA 9th",
    note: "Alphabetical by author · hanging indent · no numbering",
    numbered: false,
    alphabetical: true,
    hangingIndent: true,
    lineHeight: 2.0,
    spaceBetween: 0,
    example: "Author, Anne A. Title of the Work. Publisher, 2024.",
  },
  CHICAGO: {
    id: "CHICAGO",
    label: "Chicago",
    note: "Alphabetical by author · hanging indent · single spaced, blank line between entries",
    numbered: false,
    alphabetical: true,
    hangingIndent: true,
    lineHeight: 1.0,
    spaceBetween: 6,      // pt of space after each entry
    example: "Author, Anne A. Title of the Work. City: Publisher, 2024.",
  },
  IEEE: {
    id: "IEEE",
    label: "IEEE",
    note: "Numbered [1], [2] … in citation order · no re-sorting",
    numbered: true,
    alphabetical: false,
    hangingIndent: true,
    lineHeight: 1.0,
    spaceBetween: 4,
    example: "A. A. Author, \"Title of the paper,\" Journal Name, vol. 1, no. 2, pp. 3–4, 2024.",
  },
};

export const DEFAULT_CITATION_STYLE = "APA7";

export function getCitationStyle(id) {
  return CITATION_STYLES[id] || CITATION_STYLES[DEFAULT_CITATION_STYLE];
}

// Sort key: first author surname, ignoring leading articles and punctuation.
const sortKey = (s = "") =>
  String(s).replace(/^[\s"'“([]+/, "").replace(/^(a|an|the)\s+/i, "").toLowerCase();

/**
 * Apply the chosen style's ordering to the list and return the entries with
 * the marker each entry should carry ("[1] " for IEEE, "" for the rest).
 */
export function styledReferenceList(refs = [], styleId) {
  const st = getCitationStyle(styleId);
  const list = (refs || []).filter(r => String(r || "").trim());
  const ordered = st.alphabetical
    ? [...list].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    : list;
  return ordered.map((text, i) => ({
    text: String(text).trim(),
    marker: st.numbered ? `[${i + 1}] ` : "",
  }));
}
