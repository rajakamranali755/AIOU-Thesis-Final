/**
 * fieldFileImport.js
 *
 * Read a user-selected file and return clean, well-formatted plain text so it
 * can fill a field (a preliminary page, or a chapter / section / sub-section
 * body). Uploaded text is cleaned and reflowed the SAME way pasted text is, so
 * upload and paste behave identically.
 *
 * Supported: .txt, .md, .docx
 *   • .txt / .md → read directly, then normalised
 *   • .docx      → converted to HTML by mammoth so paragraph / heading / list
 *                  structure is preserved, then flattened to clean paragraphs
 *   • .doc       → unsupported (ask the user to re-save as .docx)
 */
import { normalizePastedText } from "./textNormalize";

// Turn mammoth HTML into clean text: one block element per paragraph, separated
// by blank lines, with inner soft-wrapping removed. Then run the shared paste
// normaliser so spacing, hyphenation and broken line-wraps are fixed.
function htmlToCleanText(html) {
  let parts = [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const blocks = doc.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, td");
    blocks.forEach((b) => {
      const t = (b.textContent || "").replace(/\s+/g, " ").trim();
      if (t) parts.push(/^(h[1-6])$/i.test(b.tagName) ? t : t);
    });
    if (!parts.length && doc.body) parts = [doc.body.textContent || ""];
  } catch {
    parts = [html.replace(/<[^>]+>/g, " ")];
  }
  return normalizePastedText(parts.join("\n\n"));
}

export async function readFieldFile(file) {
  const name = (file?.name || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";

  if (ext === "txt" || ext === "md") {
    return normalizePastedText(await file.text());
  }

  if (ext === "docx") {
    const m = await import("mammoth");
    const mammoth = m.default || m;
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    return htmlToCleanText(html);
  }

  if (ext === "doc") {
    throw new Error("Old .doc files aren't supported — please re-save as .docx (or upload a .txt).");
  }

  throw new Error("Unsupported file. Please upload a .txt or .docx file.");
}
