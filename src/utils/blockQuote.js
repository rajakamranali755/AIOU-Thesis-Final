/**
 * blockQuote.js
 * A quoted passage longer than 40 words is a block quotation: it is set in
 * from both the left and the right margin and single spaced, rather than run
 * on inside the paragraph.
 */

export const BLOCK_QUOTE_MIN_WORDS = 40;

// Both straight and curly marks, double and single.
const QUOTE_PAIRS = [
  ['"', '"'],
  ["\u201C", "\u201D"],
  ["'", "'"],
  ["\u2018", "\u2019"],
  ["\u00AB", "\u00BB"],
];

// A trailing note after the closing quotation mark — "(italics in original)",
// "(Wittgenstein, 1953, p. 11)" — is normal and still leaves it a block quote.
const MAX_TRAILING_WORDS = 15;

/**
 * Details of the quotation if this paragraph is a block quote, else null.
 * The paragraph has to open with a quotation mark and close with the matching
 * one, with more than 40 words between them; a short citation may follow.
 */
export function blockQuoteInfo(text) {
  const t = String(text || "").trim();
  if (t.length < 2) return null;
  const pair = QUOTE_PAIRS.find(([open]) => t.startsWith(open));
  if (!pair) return null;
  const [open, close] = pair;
  const closeIdx = t.lastIndexOf(close);
  if (closeIdx < open.length) return null;

  const inner = t.slice(open.length, closeIdx).trim();
  const trailing = t.slice(closeIdx + close.length).trim();
  const words = inner.split(/\s+/).filter(Boolean).length;
  if (words <= BLOCK_QUOTE_MIN_WORDS) return null;
  if (trailing && trailing.split(/\s+/).filter(Boolean).length > MAX_TRAILING_WORDS) return null;
  return { words, inner, trailing };
}

/** Is this paragraph a quotation of more than 40 words? */
export function isBlockQuote(text) {
  return blockQuoteInfo(text) !== null;
}

/** Indent used on both sides of a block quotation (five spaces). */
export const BLOCK_QUOTE_INDENT = "0.5in";
export const BLOCK_QUOTE_INDENT_TWIPS = 720;

/** A blank line is left above and below the quotation. */
export const BLOCK_QUOTE_SPACE_TWIPS = 240;
