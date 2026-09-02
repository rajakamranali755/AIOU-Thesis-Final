/**
 * sampleImport.js
 * Turns an uploaded file into thesis data the builder understands.
 *
 * Supported: .json (a saved sample), .docx (Word, via mammoth), .pdf (via
 * pdf.js) and .txt. Word/PDF/Text are parsed into chapters by detecting
 * headings; the heavy parsers are dynamically imported so they only load when
 * a user actually uploads that file type.
 */

// Build chapter objects (matching the app's data shape) from an ordered list of
// blocks: { heading: bool, level: 1|2|3, text }.
function blocksToChapters(blocks) {
  const chapters = [];
  let chap = null, sec = null;

  const newChap = (title) => {
    chap = { chapterNo: chapters.length + 1, title: title || `Chapter ${chapters.length + 1}`, body: "", sections: [] };
    chapters.push(chap); sec = null;
  };
  const newSec = (heading) => {
    if (!chap) newChap("Introduction");
    sec = { number: `${chap.chapterNo}.${chap.sections.length + 1}`, heading: heading || "", content: "", subsections: [] };
    chap.sections.push(sec);
  };

  for (const b of blocks) {
    const text = (b.text || "").trim();
    if (!text) continue;
    if (b.heading && b.level <= 2) newChap(text);
    else if (b.heading) newSec(text);
    else if (sec) sec.content += (sec.content ? "\n" : "") + text;
    else { if (!chap) newChap("Introduction"); chap.body += (chap.body ? "\n" : "") + text; }
  }
  if (chapters.length === 0) newChap("Imported Content");
  return chapters;
}

// Heuristic heading detection for flat text (PDF / TXT) → returns 0 (body) or level.
function headingLevel(line) {
  if (line.length > 80) return 0;
  if (/^chapter\s+\d+/i.test(line)) return 1;
  if (/^\d+\.\d+/.test(line)) return 3;                              // "1.1", "1.2.3" → section
  if (/^\d+\s+\S/.test(line)) return 1;                             // "1 Introduction"
  if (/^[A-Z0-9][A-Z0-9 ,&'\-]{3,}$/.test(line) && !/[.?!]$/.test(line)) return 1; // ALL CAPS short
  return 0;
}

function textToBlocks(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const level = headingLevel(line);
      return level ? { heading: true, level, text: line } : { heading: false, text: line };
    });
}

function withContent(base, filename, chapters, title) {
  const fallback = (filename || "").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return {
    ...base,
    cover: { ...(base.cover || {}), title: (title || fallback || base.cover?.title || "Imported Thesis") },
    chapters: chapters.length ? chapters : base.chapters,
    references: base.references || [],
  };
}

export async function importSampleFile(file, base) {
  const name = file.name || "";
  const ext = name.split(".").pop().toLowerCase();

  if (ext === "json") {
    const parsed = JSON.parse(await file.text());
    const incoming = parsed?.data && (parsed.data.cover || parsed.data.chapters) ? parsed.data : parsed;
    if (!incoming || typeof incoming !== "object" || (!incoming.cover && !incoming.chapters)) {
      throw new Error("That JSON file isn't a thesis sample (it needs a cover or chapters).");
    }
    return { data: { ...base, ...incoming }, templateId: parsed?.templateId };
  }

  if (ext === "txt") {
    const text = await file.text();
    return { data: withContent(base, name, blocksToChapters(textToBlocks(text))) };
  }

  if (ext === "docx") {
    const m = await import("mammoth");
    const mammoth = m.default || m;
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    const doc = new DOMParser().parseFromString(html, "text/html");
    const blocks = [...doc.body.children].map((el) => {
      const tag = el.tagName.toLowerCase();
      const level = tag === "h1" ? 1 : tag === "h2" ? 2 : (tag === "h3" || tag === "h4") ? 3 : 0;
      return { heading: level > 0, level, text: el.textContent || "" };
    });
    const title = doc.querySelector("h1, h2")?.textContent?.trim();
    return { data: withContent(base, name, blocksToChapters(blocks), title) };
  }

  if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(" ") + "\n\n";
    }
    return { data: withContent(base, name, blocksToChapters(textToBlocks(text))) };
  }

  if (ext === "doc") {
    throw new Error("Old .doc files aren't supported — please re-save as .docx, or upload a .pdf or .json.");
  }

  throw new Error("Unsupported file type. Please upload a .json, .docx, .pdf or .txt file.");
}
