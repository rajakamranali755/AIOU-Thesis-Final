/**
 * textNormalize.js
 *
 * Clean up text pasted into a field. Pasting from PDFs / Word commonly brings
 * broken line-wraps, double spaces, non-breaking spaces and words hyphenated
 * across line breaks. This normalises all of that to tidy paragraphs.
 */

export function normalizePastedText(raw = "", { singleLine = false } = {}) {
  let s = String(raw);

  // Normalise line endings.
  s = s.replace(/\r\n?/g, "\n");
  // Non-breaking / odd unicode spaces → a normal space.
  s = s.replace(/[\u00A0\u2007\u202F\u2009\u200A\u2002\u2003]/g, " ");
  // Zero-width characters → removed.
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  // Word hyphenated across a line break ("infor-\nmation" → "information").
  s = s.replace(/([A-Za-z])-\n(?=[A-Za-z])/g, "$1");

  if (singleLine) {
    // Single-line fields (title, name, etc.): no line breaks at all.
    return s.replace(/\s+/g, " ").trim();
  }

  // Collapse runs of spaces/tabs (but not newlines).
  s = s.replace(/[ \t]+/g, " ");
  // Trim spaces hugging each line break.
  s = s.replace(/ *\n */g, "\n");
  // Reflow soft wraps: a single line break inside a paragraph becomes a space,
  // while blank-line paragraph breaks are preserved.
  s = s.replace(/([^\n])\n(?!\n)/g, "$1 ");
  // Collapse 3+ blank lines down to a single paragraph break.
  s = s.replace(/\n{3,}/g, "\n\n");
  // Tidy any double spaces produced by the reflow.
  s = s.replace(/ {2,}/g, " ");

  return s.trim();
}

/**
 * onPaste handler for a controlled <textarea>/<input>. Inserts the cleaned text
 * at the caret (replacing any selection) and keeps the caret after it.
 *   onPaste={(e) => cleanPasteInto(e, value, onChange, { singleLine })}
 */
export function cleanPasteInto(e, currentValue = "", onChange, opts = {}) {
  const clip = e.clipboardData || window.clipboardData;
  const text = clip ? clip.getData("text") : null;
  if (text == null) return;            // nothing to clean — let the browser handle it
  e.preventDefault();

  const cleaned = normalizePastedText(text, opts);
  const el = e.target;
  const start = el.selectionStart ?? currentValue.length;
  const end = el.selectionEnd ?? currentValue.length;
  const next = currentValue.slice(0, start) + cleaned + currentValue.slice(end);
  onChange(next);

  // Restore the caret just after the inserted text once React re-renders.
  const caret = start + cleaned.length;
  requestAnimationFrame(() => {
    try { el.selectionStart = el.selectionEnd = caret; } catch { /* ignore */ }
  });
}
