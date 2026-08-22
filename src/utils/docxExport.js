/**
 * docxExport.js — generates a REAL Word .docx (Office Open XML) with genuine
 * page breaks and A4 section properties, so pagination is identical in Word,
 * Google Docs, WPS and LibreOffice. Replaces the old HTML-as-.doc exporter,
 * which opened in "Web layout" and ignored page breaks.
 */
import {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, LineRuleType, HeightRule, ShadingType,
  TabStopType, LeaderType, Footer, PageNumber, NumberFormat, Bookmark, PageReference,
  convertMillimetersToTwip,
} from "docx";
import { TEMPLATES, URDU_LABELS } from "../data/themeTemplates";
import { chapterBlocks } from "./chapterBlocks";
import { aiouPhdPageTexts, isArabicLine } from "./aiouPhdPages";

// ── unit helpers ──────────────────────────────────────────────────────────────
function lenToMm(s) {
  if (typeof s !== "string") return Number(s) || 0;
  const v = parseFloat(s) || 0;
  if (s.endsWith("cm")) return v * 10;
  if (s.endsWith("mm")) return v;
  if (s.endsWith("in")) return v * 25.4;
  if (s.endsWith("pt")) return v * 25.4 / 72;
  if (s.endsWith("px")) return v * 25.4 / 96;
  return v;
}
const mmTwip = (mm) => convertMillimetersToTwip(mm);
const lenTwip = (css) => mmTwip(lenToMm(css));
const ptHalf = (css) => Math.round((parseFloat(css) || 12) * 2);   // half-points
const hex = (c) => (c || "#000000").replace("#", "");
const lineTwips = (lh) => Math.round((Number(lh) || 1.5) * 240);   // 240 = single

const NUM_WORDS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
  "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY"];
const numWord = (n) => NUM_WORDS[n] || String(n);

// ── image helpers (no DOM needed) ───────────────────────────────────────────
function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(0, comma);
  const b64 = dataUrl.slice(comma + 1);
  const mime = (/data:(.*?);base64/.exec(meta) || [])[1] || "image/png";
  const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
}
function imageSize(bytes, mime) {
  try {
    if (mime.includes("png")) {
      const dv = new DataView(bytes.buffer);
      return { w: dv.getUint32(16), h: dv.getUint32(20) };
    }
    if (mime.includes("gif")) {
      return { w: bytes[6] | (bytes[7] << 8), h: bytes[8] | (bytes[9] << 8) };
    }
    if (mime.includes("jpeg") || mime.includes("jpg")) {
      let i = 2;
      while (i < bytes.length) {
        if (bytes[i] !== 0xff) { i++; continue; }
        const m = bytes[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          const h = (bytes[i + 5] << 8) | bytes[i + 6];
          const w = (bytes[i + 7] << 8) | bytes[i + 8];
          return { w, h };
        }
        i += 2 + ((bytes[i + 2] << 8) | bytes[i + 3]);
      }
    }
  } catch { /* fall through */ }
  return { w: 1600, h: 1000 };
}
function imgType(mime) {
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("bmp")) return "bmp";
  return "jpg";
}

// ── main builder ────────────────────────────────────────────────────────────
export function buildThesisDocx(data, templateId = "hec_standard") {
  const tpl = TEMPLATES[templateId] || TEMPLATES.hec_standard;
  const { cover = {}, preliminary = {}, chapters = [], references = [] } = data;
  const isRTL = tpl.direction === "rtl";
  const isUrdu = tpl.language === "urdu";
  const bodyFont = tpl.fonts?.body || "Times New Roman";
  const headFont = tpl.fonts?.heading || bodyFont;
  const accent = hex(tpl.colors?.coverAccent || "#000000");
  const titleCol = hex(tpl.colors?.coverTitle || "#000000");
  const L = {
    abstract: isUrdu ? URDU_LABELS.abstract : "ABSTRACT",
    acknowledgement: isUrdu ? URDU_LABELS.acknowledgement : "ACKNOWLEDGEMENT",
    dedication: isUrdu ? URDU_LABELS.dedication : "DEDICATION",
    declaration: isUrdu ? URDU_LABELS.declaration : "DECLARATION",
    references: (!isUrdu && tpl.referencesLabel) ? tpl.referencesLabel : (isUrdu ? URDU_LABELS.references : "REFERENCES"),
  };

  const leftMm = lenToMm(isRTL ? (tpl.margins.right || "2.5cm") : (tpl.margins.left || "3.8cm"));
  const rightMm = lenToMm(isRTL ? (tpl.margins.left || "3.8cm") : (tpl.margins.right || "2.5cm"));
  const contentPx = Math.round((210 - leftMm - rightMm) / 25.4 * 96);

  const splitParas = (t) => (t || "").split("\n").map(s => s.trim()).filter(Boolean);

  // paragraph factories ------------------------------------------------------
  const bodyPara = (text) => new Paragraph({
    alignment: isRTL ? AlignmentType.JUSTIFY : (tpl.apaStrict ? AlignmentType.LEFT : AlignmentType.JUSTIFY),
    bidirectional: isRTL,
    spacing: { after: 0, line: lineTwips(tpl.bodyLineHeight), lineRule: LineRuleType.AUTO },
    indent: tpl.paraIndent ? { firstLine: lenTwip(tpl.paraIndent) } : undefined,
    children: [new TextRun({ text, font: bodyFont, size: ptHalf(tpl.bodyFontSize) })],
  });

  const prelimBodyPara = (text) => new Paragraph({
    alignment: tpl.apaStrict ? AlignmentType.LEFT : AlignmentType.JUSTIFY,
    bidirectional: isRTL,
    spacing: { after: 0, line: lineTwips(tpl.bodyLineHeight), lineRule: LineRuleType.AUTO, before: 240 },
    children: [new TextRun({ text, font: bodyFont, size: ptHalf(tpl.refFontSize || "11pt") })],
  });

  const sectionTitle = (text, { breakBefore } = {}) => new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: !!breakBefore,
    keepNext: true, keepLines: true,
    spacing: { after: 240, before: 0 },
    children: [new TextRun({ text, bold: true, allCaps: !isUrdu && !tpl.apaStrict, font: headFont, size: ptHalf(tpl.chapterTitleSize || "16pt"), color: "000000" })],
  });

  const sigPara = (name) => ([
    new Paragraph({
      alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
      spacing: { before: 720 },
      children: [new TextRun({ text: `(${name})`, font: bodyFont, size: ptHalf(tpl.refFontSize || "11pt") })],
    }),
    new Paragraph({
      alignment: isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT,
      children: [new TextRun({ text: isRTL ? "تاریخ: _____________" : "Date: _______________", font: bodyFont, size: 18, color: "888888" })],
    }),
  ]);

  const chapterNumPara = (label) => new Paragraph({
    alignment: tpl.apaStrict ? AlignmentType.CENTER : (tpl.chapterNumAlign === "center" ? AlignmentType.CENTER : (isRTL ? AlignmentType.LEFT : AlignmentType.RIGHT)),
    pageBreakBefore: true,
    keepNext: true, keepLines: true,
    spacing: { after: 80, before: 0 },
    children: [new TextRun({ text: label, bold: true, underline: tpl.apaStrict ? undefined : {}, allCaps: !isUrdu && !tpl.apaStrict, font: headFont, size: ptHalf(tpl.chapterNumSize || "16pt"), color: accent })],
  });

  const chapterTitlePara = (title) => new Paragraph({
    alignment: AlignmentType.CENTER,
    outlineLevel: 0,
    keepNext: true, keepLines: true,
    spacing: { after: 160, before: 0 },
    children: [new TextRun({ text: title || "(Chapter Title)", bold: true, allCaps: !isUrdu && !tpl.apaStrict, font: headFont, size: ptHalf(tpl.chapterTitleSize || "16pt"), color: titleCol })],
  });

  const epigraphPara = (text) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240 },
    children: [new TextRun({ text, italics: true, font: bodyFont, size: ptHalf(tpl.bodyFontSize) })],
  });

  const secHeadColor = tpl.sectionColor ? hex(tpl.sectionColor) : accent;
  const secHeadPara = (num, heading, sub) => new Paragraph({
    alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
    outlineLevel: sub ? 2 : 1,
    keepNext: true, keepLines: true,
    spacing: { before: sub ? 200 : 240, after: 60 },
    children: [new TextRun({ text: `${num} ${heading}`, bold: true, allCaps: !isUrdu && !!tpl.sectionCaps, font: headFont, size: ptHalf(tpl.sectionSize || "14pt"), color: secHeadColor })],
  });

  const figureParas = (b) => {
    const out = [];
    if (b.imageData) {
      try {
        const { bytes, mime } = dataUrlToBytes(b.imageData);
        const { w, h } = imageSize(bytes, mime);
        let dispW = Math.min(contentPx, w || contentPx);
        let dispH = Math.round(dispW * (h / w || 0.62));
        const maxH = Math.round(8.2 * 96); // cap ~8.2in tall
        if (dispH > maxH) { dispH = maxH; dispW = Math.round(dispH * (w / h || 1.6)); }
        out.push(new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { before: 200, after: 40 },
          keepNext: true, keepLines: true,
          children: [new ImageRun({ type: imgType(mime), data: bytes, transformation: { width: dispW, height: dispH } })],
        }));
      } catch {
        out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "[Figure image could not be embedded]", italics: true, color: "888888", font: bodyFont, size: 22 })] }));
      }
    } else {
      out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 40 }, keepNext: true, keepLines: true, children: [new TextRun({ text: "[Figure — no image uploaded]", italics: true, color: "888888", font: bodyFont, size: 22 })] }));
    }
    const label = b.label || "Figure:";
    out.push(new Paragraph({
      alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
      spacing: { after: 120 },
      keepLines: true,
      children: [
        new TextRun({ text: label + " ", bold: true, font: bodyFont, size: ptHalf(tpl.refFontSize || "11pt") }),
        new TextRun({ text: (b.caption || "") + (b.description ? `: ${b.description}` : ""), font: bodyFont, size: ptHalf(tpl.refFontSize || "11pt") }),
      ],
    }));
    return out;
  };

  const tableParas = (b) => {
    const out = [];
    if (b.caption) out.push(new Paragraph({
      spacing: { before: 200, after: 60 },
      keepNext: true, keepLines: true,
      children: [new TextRun({ text: b.caption, bold: true, font: headFont, size: ptHalf(tpl.bodyFontSize), color: accent })],
    }));
    const headers = b.headers || [];
    const rows = b.rows || [];
    const cell = (text, { bold, headerBorder, last } = {}) => new TableCell({
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      borders: {
        top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        bottom: headerBorder ? { style: BorderStyle.SINGLE, size: 6, color: "000000" }
              : last ? { style: BorderStyle.SINGLE, size: 6, color: "000000" }
              : { style: BorderStyle.NONE },
      },
      children: [new Paragraph({
        alignment: bold ? AlignmentType.CENTER : (isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT),
        spacing: { after: 0, line: 240, lineRule: LineRuleType.AUTO },
        children: [new TextRun({ text: String(text ?? ""), bold: !!bold, font: bodyFont, size: ptHalf(tpl.refFontSize || "11pt") })],
      })],
    });
    const trows = [];
    if (headers.length) trows.push(new TableRow({ tableHeader: true, cantSplit: true, children: headers.map(h => cell(h, { bold: true, headerBorder: true })) }));
    rows.forEach((r, ri) => trows.push(new TableRow({ cantSplit: true, children: r.map(c => cell(c, { last: ri === rows.length - 1 })) })));
    if (trows.length) out.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
        left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
      },
      rows: trows,
    }));
    out.push(new Paragraph({ text: "", spacing: { after: 120 } }));
    return out;
  };

  // ── COVER children ──
  const NONE = { style: BorderStyle.NONE };
  const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
  const bar = (colorHex, widthPct, thickTwip) => new Table({
    alignment: AlignmentType.CENTER,
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [new TableRow({
      height: { value: thickTwip, rule: HeightRule.EXACT },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: colorHex, color: "auto" },
        borders: { top: NONE, bottom: NONE, left: NONE, right: NONE },
        children: [new Paragraph({ spacing: { after: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [new TextRun({ text: "", size: 2 })] })],
      })],
    })],
  });
  const cLine = (text, { size = 26, bold = true, color, italics = false, caps = false, font = headFont, before = 60, after = 0 } = {}) =>
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before, after }, children: [new TextRun({ text: text || "", bold, italics, allCaps: caps, font, size, color })] });

  const sky = titleCol;       // AIOU sky blue (coverTitle)
  const orange = accent;      // AIOU orange (coverAccent)
  const coverKids = [];

  if (tpl.id === "aiou") {
    const cl = (text, opts = {}) => coverKids.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: opts.before ?? 0, after: opts.after ?? 0, line: opts.line || 300, lineRule: LineRuleType.AUTO },
      children: [new TextRun({ text: text || "", bold: opts.bold !== false, italics: !!opts.italics, allCaps: !!opts.caps, font: opts.font || headFont, size: opts.size || 24, color: "000000" })],
    }));
    cl(cover.title || "THESIS TITLE", { size: ptHalf(tpl.coverTitleSize || "16pt"), caps: true, before: 240, after: 360, line: 360 });
    if (cover.logo) {
      try { const { bytes, mime } = dataUrlToBytes(cover.logo); coverKids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 360 }, children: [new ImageRun({ type: imgType(mime), data: bytes, transformation: { width: 150, height: 150 } })] })); }
      catch { cl("[University Emblem]", { italics: true, bold: false, color: "888888", font: bodyFont, size: 20, before: 120, after: 360 }); }
    } else {
      cl("[University Emblem]", { italics: true, bold: false, font: bodyFont, size: 20, before: 120, after: 360 });
    }
    cl(cover.authorName || "Author Name", { size: 26 });
    if (cover.registrationNo) cl(`Roll No. ${cover.registrationNo}`, { bold: false, font: bodyFont, size: 24 });
    cl("Submitted in partial fulfillment of the requirement for the", { bold: false, font: bodyFont, size: 24, before: 560 });
    cl(cover.degree || "M.Sc.", { bold: false, font: bodyFont, size: 24 });
    if (cover.faculty) cl(`At the Faculty of ${cover.faculty},`, { bold: false, font: bodyFont, size: 24 });
    cl(`${cover.university || "Allama Iqbal Open University, Islamabad"}.`, { bold: false, font: bodyFont, size: 24 });
    if (cover.session) cl(cover.session, { size: 26, before: 640 });
  } else if (tpl.coverLayout === "pu_style") {
    // University of the Punjab (IER) title page — built from the cover fields.
    const puL = (text, opts = {}) => coverKids.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: opts.before ?? 0, after: opts.after ?? 0, line: opts.line || 300, lineRule: LineRuleType.AUTO },
      children: [new TextRun({ text: text || "", bold: opts.bold !== false, allCaps: !!opts.caps, font: opts.font || headFont, size: opts.size || ptHalf("14pt"), color: opts.color || "000000" })],
    }));
    if (cover.logo) { try { const { bytes, mime } = dataUrlToBytes(cover.logo); coverKids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 240 }, children: [new ImageRun({ type: imgType(mime), data: bytes, transformation: { width: 120, height: 120 } })] })); } catch { /* ignore */ } }
    puL(cover.title || "THESIS TITLE", { size: ptHalf(tpl.coverTitleSize || "18pt"), caps: true, color: titleCol, before: 240, after: 600, line: 360 });
    puL(cover.authorName || "Author Name", { size: ptHalf(tpl.coverAuthorSize || "14pt") });
    if (cover.registrationNo) puL(cover.registrationNo, { bold: false, font: bodyFont, size: 24 });
    if (cover.department) puL(cover.department, { caps: true, size: ptHalf(tpl.coverDeptSize || "14pt"), before: 700 });
    if (cover.faculty) puL(cover.faculty, { caps: true, size: ptHalf(tpl.coverDeptSize || "14pt") });
    puL(cover.university || "University of the Punjab", { caps: true, size: ptHalf(tpl.coverDeptSize || "14pt"), color: titleCol });
    puL("Lahore", { caps: true, size: ptHalf(tpl.coverDeptSize || "14pt") });
    if (cover.session) puL(cover.session, { caps: true, size: 24, before: 700 });
  } else {
    // Generic cover (other templates)
    const cP = (text, opts = {}) => coverKids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: opts.before ?? 60, after: opts.after ?? 0 }, children: [new TextRun({ text: text || "", bold: opts.bold !== false, font: opts.font || headFont, size: opts.size || ptHalf("14pt"), color: opts.color, italics: opts.italics })] }));
    if (cover.logo) { try { const { bytes, mime } = dataUrlToBytes(cover.logo); coverKids.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 }, children: [new ImageRun({ type: imgType(mime), data: bytes, transformation: { width: 150, height: 113 } })] })); } catch { /* ignore */ } }
    cP(cover.title, { size: ptHalf(tpl.coverTitleSize || "16pt"), color: titleCol, before: 240, after: 200 });
    cP("A Thesis Submitted in Partial Fulfillment of the Requirements for the Award of the Degree of", { bold: false, font: bodyFont, size: 24, before: 200 });
    cP(cover.degree, { size: ptHalf(tpl.coverAuthorSize || "14pt"), color: titleCol });
    if (cover.subject) { cP("In", { bold: false, font: bodyFont, size: 24 }); cP(cover.subject, { size: ptHalf(tpl.coverAuthorSize || "14pt"), color: titleCol }); }
    cP("BY", { color: accent, before: 240 });
    cP(cover.authorName, { size: ptHalf(tpl.coverAuthorSize || "14pt"), color: titleCol });
    if (cover.registrationNo) cP(`REGISTRATION # ${cover.registrationNo}`, { size: 28 });
    if (cover.supervisor) { cP("Supervisor", { bold: false, font: bodyFont, size: 24, color: "555555", before: 200 }); cP(cover.supervisor, { color: titleCol }); if (cover.supervisorDesignation) cP(cover.supervisorDesignation, { bold: false, font: bodyFont, size: 22, color: "555555" }); }
    if (cover.department) cP(cover.department, { color: titleCol, before: 240 });
    if (cover.university) cP(cover.university, { color: accent });
    if (cover.session) cP(`Session ${cover.session}`, { bold: false, font: bodyFont, size: 24 });
  }

  // ── AIOU PhD TEMPLATE PAGES (Appendix E & G) ─────────────────────────────
  // Each page is built from its editable text in the Preliminary step — the
  // same way the Abstract or Acknowledgement is built from its text — so the
  // Word export shows exactly what was written. Clearing a text removes the
  // page. Only for the AIOU template, where these pages live in the preview.
  const buildAiouAppendixPages = () => {
    if (tpl.id !== "aiou") return [];
    const AP = aiouPhdPageTexts(preliminary, cover);
    const vv = preliminary.vivaVoce || {};
    const out = [];
    let firstPage = true;
    const pageBreak = () => { const b = !firstPage; firstPage = false; return b; };
    const blank = (v, dashes = 18) => (v && String(v).trim()) ? String(v) : "_".repeat(dashes);
    const R = (text, bold = false) => new TextRun({ text: text || "", bold, font: bodyFont, size: 24, color: "000000" });
    const CT = (text, { bold = false, size = 24, before = 0, after = 0, italics = false, caps = false, underline = false, breakBefore = false, line = 320 } = {}) =>
      new Paragraph({ alignment: AlignmentType.CENTER, pageBreakBefore: breakBefore, spacing: { before, after, line, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: text || "", bold, italics, allCaps: caps, underline: underline ? {} : undefined, font: bodyFont, size, color: "000000" })] });
    const LT = (text, { bold = false, size = 24, before = 0, after = 0, italics = false } = {}) =>
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before, after, line: 320, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: text || "", bold, italics, font: bodyFont, size, color: "000000" })] });
    const RGT = (text, { bold = false, before = 0 } = {}) =>
      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before, after: 0 }, children: [new TextRun({ text: text || "", bold, font: bodyFont, size: 24, color: "000000" })] });
    const JT = (text, { before = 0, line = 440 } = {}) =>
      new Paragraph({ alignment: AlignmentType.JUSTIFY, spacing: { before, after: 0, line, lineRule: LineRuleType.AUTO }, children: [R(text)] });

    // Appendix E-II — Inner Title page
    if (AP.innerTitle.trim()) {
      out.push(CT(cover.title || "THESIS TITLE", { bold: true, caps: true, size: 36, breakBefore: pageBreak(), before: 200, after: 120, line: 400 }));
      out.push(CT(cover.authorName || "NAME OF SCHOLAR", { bold: true, caps: true, size: 32, before: 900 }));
      out.push(CT(`Roll No. ${cover.registrationNo || "__________"}`, { bold: true, size: 32, before: 60 }));
      if (cover.logo) {
        try { const { bytes, mime } = dataUrlToBytes(cover.logo); out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 700, after: 0 }, children: [new ImageRun({ type: imgType(mime), data: bytes, transformation: { width: 155, height: 155 } })] })); }
        catch { out.push(CT("[University Emblem]", { italics: true, size: 20, before: 700 })); }
      } else out.push(CT("[University Emblem]", { italics: true, size: 20, before: 700 }));
      const itLines = splitParas(AP.innerTitle);
      itLines.forEach((ln, i) => out.push(CT(ln, { size: 24, before: i === 0 ? 900 : 0, bold: i === itLines.length - 1, line: 400 })));
    }

    // Appendix E-III — "In the Name of Allah" page
    if (AP.bismillah.trim()) {
      splitParas(AP.bismillah).forEach((ln, i) => {
        if (isArabicLine(ln)) out.push(new Paragraph({ alignment: AlignmentType.CENTER, pageBreakBefore: i === 0 ? pageBreak() : false, spacing: { before: i === 0 ? 500 : 160, after: 160 }, children: [new TextRun({ text: ln, bold: true, font: "Traditional Arabic", size: 52, rightToLeft: true, color: "000000" })] }));
        else out.push(CT(ln, { size: 24, caps: true, breakBefore: i === 0 ? pageBreak() : false, before: i === 0 ? 500 : 0 }));
      });
    }

    // Appendix E-IV — Acceptance by the Viva Voce Committee
    if (AP.vivaVoce.trim()) {
      out.push(CT(cover.university || "Allama Iqbal Open University, Islamabad", { bold: true, size: 26, breakBefore: pageBreak() }));
      out.push(CT(`Department: ${blank(vv.department || cover.department)}`, { italics: true, before: 220 }));
      out.push(CT("(Acceptance by the Viva Voce Committee)", { before: 140 }));
      out.push(new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 320, after: 0 }, children: [R("Title of Thesis: "), R(blank(cover.title, 30), !!cover.title)] }));
      out.push(new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 220, after: 0 }, children: [R("Name of Student: "), R(blank(cover.authorName, 24), !!cover.authorName)] }));
      splitParas(AP.vivaVoce).forEach((p, i) => out.push(JT(p, { before: i === 0 ? 280 : 160 })));
      const sigParas = (label, name, align = AlignmentType.CENTER) => {
        const ps = [new Paragraph({ alignment: align, spacing: { before: 360, after: 0 }, children: [R("________________________")] })];
        if (name) ps.push(new Paragraph({ alignment: align, spacing: { before: 0, after: 0 }, children: [R(name, true)] }));
        ps.push(new Paragraph({ alignment: align, spacing: { before: 0, after: 0 }, children: [R(label)] }));
        return ps;
      };
      const cellNoBorder = (paras) => new TableCell({ borders: { top: NONE, bottom: NONE, left: NONE, right: NONE }, width: { size: 50, type: WidthType.PERCENTAGE }, children: paras });
      out.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [new TableRow({ children: [
          cellNoBorder([
            new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 280, after: 0 }, children: [R("Viva Voce Committee", true)] }),
            ...sigParas("External Examiner", vv.externalExaminer),
            ...sigParas("Internal Examiner", vv.internalExaminer),
            ...sigParas("Chairperson/Director", vv.chairperson),
            ...sigParas("Dean", vv.dean),
          ]),
          cellNoBorder([
            new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 280, after: 0 }, children: [R("Supervisor", true)] }),
            new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 360, after: 0 }, children: [R("________________________")] }),
            ...((vv.supervisor || cover.supervisor) ? [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 0 }, children: [R(vv.supervisor || cover.supervisor, true)] })] : []),
          ]),
        ] })],
      }));
      out.push(new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 360, after: 0 }, children: [R("Members:  ", true), R(`${blank(vv.member1)}        ${blank(vv.member2)}`)] }));
      out.push(LT(vv.date ? vv.date : "(Day, Month, Year)", { before: 320, bold: !!vv.date }));
    }

    // Appendix G(a) — Declaration by the Student
    if (AP.studentDeclaration.trim()) {
      out.push(CT("DECLARATION BY THE STUDENT AT THE TIME OF", { bold: true, size: 26, breakBefore: pageBreak(), line: 300 }));
      out.push(CT("SUBMISSION OF THESIS TO THE SUPERVISOR", { bold: true, size: 26, line: 300 }));
      out.push(CT("FOR EXTERNAL EVALUATION", { bold: true, size: 26, line: 300 }));
      out.push(CT("(To be retained by the controller of examinations)", { bold: true, size: 24, before: 40 }));
      out.push(CT("DECLARATION", { bold: true, size: 26, before: 420 }));
      splitParas(AP.studentDeclaration).forEach((p, i) => out.push(JT(p, { before: i === 0 ? 300 : 200 })));
      out.push(RGT("Signature: ____________________", { before: 640 }));
      out.push(LT(`Name in Full: ${blank(cover.authorName, 20)}`, { before: 460 }));
      out.push(LT("Date: ______________ (Day, Month, Year)", { before: 80 }));
    }

    // Appendix G(b) — Plagiarism Undertaking
    if (AP.plagiarism.trim()) {
      out.push(CT("Plagiarism Undertaking", { bold: true, size: 28, underline: true, breakBefore: pageBreak() }));
      splitParas(AP.plagiarism).forEach((p, i) => out.push(JT(p, { before: i === 0 ? 340 : 240 })));
      out.push(RGT("Student/Author Signature: ....................................", { before: 700 }));
      out.push(RGT(`Name: ${blank(cover.authorName, 22)}`, { before: 300 }));
    }

    return out;
  };

  // ══════════════════════ AIOU DEMO FORMAT (faithful) ══════════════════════
  if (tpl.id === "aiou") {
    const want = (v) => v !== false;            // these front-matter parts default ON
    const P = preliminary;
    const fm = [];        // front matter (roman page numbers)
    const main = [];      // chapters + references (arabic page numbers)

    const centerLine = (text, { bold = false, size = 24, before = 0, after = 0, italics = false } = {}) =>
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before, after, line: 300, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: text || "", bold, italics, font: bodyFont, size, color: "000000" })] });
    const leftLine = (text, { bold = false, size = 24, before = 0, after = 0 } = {}) =>
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before, after }, children: [new TextRun({ text: text || "", bold, font: bodyFont, size, color: "000000" })] });

    // 0) AIOU PhD TEMPLATE PAGES (Appendix E & G) — built from their editable text
    buildAiouAppendixPages().forEach((p) => fm.push(p));

    // 1) ABSTRACT
    if (P.abstract) { fm.push(sectionTitle(L.abstract, { breakBefore: fm.length > 0 })); splitParas(P.abstract).forEach(p => fm.push(bodyPara(p))); }

    // 2) APPROVAL SHEET
    if (want(P.includeApproval)) {
      const a = P.approval || {};
      fm.push(sectionTitle("APPROVAL SHEET", { breakBefore: fm.length > 0 }));
      fm.push(bodyPara(`Accepted by the ${cover.faculty || "Faculty"}, ${cover.university || "Allama Iqbal Open University, Islamabad"}, in partial fulfillment of the requirements for the ${cover.degree || "degree"}${cover.subject ? ` ${cover.subject}` : ""} degree.`));
      fm.push(leftLine("Viva Voce Committee:", { bold: true, before: 240 }));
      const sig = (label, name) => {
        fm.push(leftLine("________________________", { before: 360 }));
        if (name) fm.push(leftLine(name, { bold: true }));
        fm.push(leftLine(label, { after: 40 }));
      };
      sig("Chairperson of Department", a.chairperson);
      sig("External Examiner", a.externalExaminer);
      sig("Internal Examiner", a.internalExaminer);
      fm.push(leftLine("Date: ____________", { before: 200 }));
    }

    // 3) ACKNOWLEDGEMENT
    if (P.acknowledgement) { fm.push(sectionTitle(L.acknowledgement, { breakBefore: fm.length > 0 })); splitParas(P.acknowledgement).forEach(p => fm.push(bodyPara(p))); if (cover.authorName) sigPara(cover.authorName).forEach(p => fm.push(p)); }

    // 4) FORWARDING CERTIFICATE
    if (want(P.includeForwarding)) {
      fm.push(sectionTitle("FORWARDING CERTIFICATE", { breakBefore: fm.length > 0 }));
      const ftext = P.forwardingText ||
        `This research entitled "${cover.title || "[Title]"}" is conducted under my supervision and the thesis is submitted to the ${cover.university || "Allama Iqbal Open University, Islamabad"}, in the partial fulfillment of the requirement of degree ${cover.degree || "[Degree]"}${cover.subject ? ` ${cover.subject}` : ""} with my permission.`;
      fm.push(bodyPara(ftext));
      fm.push(centerLine("________________________", { before: 700 }));
      const supName = P.supervisorName || cover.supervisor;
      const supQual = P.supervisorQualifications;
      const supDesig = P.supervisorDesignation || cover.supervisorDesignation;
      const supInst = P.supervisorInstitution;
      if (supName) fm.push(centerLine(supName, { bold: true }));
      if (supQual) fm.push(centerLine(supQual));
      if (supDesig) fm.push(centerLine(supDesig));
      if (supInst) fm.push(centerLine(supInst, { bold: true }));
    }

    // 5) DEDICATION
    if (P.dedication) { fm.push(sectionTitle(L.dedication, { breakBefore: fm.length > 0 })); splitParas(P.dedication).forEach(p => fm.push(prelimBodyPara(p))); }

    // 6) TABLE OF CONTENTS (chapters + sections + references) — dotted leaders + live page numbers
    const rightTab = convertMillimetersToTwip(210 - leftMm - rightMm);
    // A dotted entry whose page number is a live PAGEREF to a bookmark placed in the body.
    const refEntry = (label, bmId, lvl, opts = {}) => {
      const bold = opts.bold != null ? opts.bold : lvl === 0;
      const size = ptHalf(lvl === 0 && bold ? tpl.bodyFontSize : (tpl.refFontSize || "11pt"));
      return new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: rightTab, leader: LeaderType.DOT }],
        indent: { left: lvl * 280 },
        spacing: { before: lvl === 0 ? 140 : 30, after: 0, line: 300, lineRule: LineRuleType.AUTO },
        children: [
          new TextRun({ text: `${label}\t`, bold, font: bodyFont, size }),
          new TextRun({ children: [new PageReference(bmId)], bold, font: bodyFont, size }),
        ],
      });
    };
    // Pre-compute stable bookmark ids for chapters/sections/figures/tables.
    const tblItems = [], figItems = [];
    chapters.forEach((ch, i) => chapterBlocks(ch).forEach((b, bi) => {
      if (b.type === "table" && (b.caption || b.label)) tblItems.push({ b, bm: `bmTbl_${i}_${bi}` });
      if (b.type === "figure" && (b.caption || b.label)) figItems.push({ b, bm: `bmFig_${i}_${bi}` });
    }));
    if (want(P.includeToc)) {
      fm.push(sectionTitle("TABLE OF CONTENTS", { breakBefore: fm.length > 0 }));
      chapters.forEach((ch, i) => {
        fm.push(refEntry(`CHAPTER ${numWord(ch.chapterNo || i + 1)}  ${(ch.title || "").toUpperCase()}`, `bmCh_${i}`, 0));
        (ch.sections || []).forEach((sec, si) => {
          fm.push(refEntry(`${sec.number} ${sec.heading}`, `bmCh_${i}_s${si}`, 1));
          (sec.subsections || []).forEach((sub, sbi) => fm.push(refEntry(`${sub.number} ${sub.heading}`, `bmCh_${i}_s${si}_ss${sbi}`, 2)));
        });
      });
      if (references.length) fm.push(refEntry("REFERENCES", "bmRefs", 0));
    }

    // 7) LIST OF TABLES / 8) LIST OF FIGURES — auto-built, dotted leaders + live page numbers
    if (want(P.includeListOfTables) && tblItems.length) {
      fm.push(sectionTitle("LIST OF TABLES", { breakBefore: fm.length > 0 }));
      tblItems.forEach((t, i) => fm.push(refEntry((t.b.caption || t.b.label || `Table ${i + 1}`).trim(), t.bm, 0, { bold: false })));
    }
    if (want(P.includeListOfFigures) && figItems.length) {
      fm.push(sectionTitle("LIST OF FIGURES", { breakBefore: fm.length > 0 }));
      figItems.forEach((f, i) => fm.push(refEntry(`${f.b.label || `Figure ${i + 1}`} ${f.b.caption || ""}`.trim(), f.bm, 0, { bold: false })));
    }

    // 9) ABBREVIATIONS AND ACRONYM
    const abbr = (P.abbreviations || []).filter(a => a && (a.abbr || a.full));
    if (want(P.includeAbbreviations) && abbr.length) {
      fm.push(sectionTitle("ABBREVIATIONS AND ACRONYM", { breakBefore: fm.length > 0 }));
      abbr.forEach(a => fm.push(new Paragraph({
        tabStops: [{ type: TabStopType.LEFT, position: convertMillimetersToTwip(45) }],
        spacing: { after: 40, line: 276, lineRule: LineRuleType.AUTO },
        children: [new TextRun({ text: `${a.abbr || ""}\t${a.full || ""}`, font: bodyFont, size: 24 })],
      })));
    }

    // ── MAIN BODY: chapters (combined heading) + references ── (with bookmarks for the lists/TOC)
    chapters.forEach((ch, i) => {
      main.push(new Paragraph({
        alignment: AlignmentType.CENTER, outlineLevel: 0, pageBreakBefore: i > 0, spacing: { before: 0, after: 240 },
        children: [new Bookmark({ id: `bmCh_${i}`, children: [new TextRun({ text: `CHAPTER ${numWord(ch.chapterNo || i + 1)}  ${ch.title || ""}`.toUpperCase(), bold: true, font: headFont, size: ptHalf(tpl.chapterTitleSize || "16pt"), color: "000000" })] })],
      }));
      if (ch.epigraph) main.push(epigraphPara(ch.epigraph));
      chapterBlocks(ch).forEach((b, bi) => {
        if (b.type === "figure") { main.push(new Paragraph({ spacing: { after: 0 }, children: [new Bookmark({ id: `bmFig_${i}_${bi}`, children: [new TextRun({ text: "" })] })] })); figureParas(b).forEach(p => main.push(p)); }
        else if (b.type === "table") { main.push(new Paragraph({ spacing: { after: 0 }, children: [new Bookmark({ id: `bmTbl_${i}_${bi}`, children: [new TextRun({ text: "" })] })] })); tableParas(b).forEach(p => main.push(p)); }
        else splitParas(b.content).forEach(p => main.push(bodyPara(p)));
      });
      (ch.sections || []).forEach((sec, si) => {
        main.push(new Paragraph({
          alignment: AlignmentType.LEFT, outlineLevel: 1, spacing: { before: 240, after: 60 },
          children: [new Bookmark({ id: `bmCh_${i}_s${si}`, children: [new TextRun({ text: `${sec.number} ${sec.heading}`, bold: true, allCaps: !!tpl.sectionCaps, font: headFont, size: ptHalf(tpl.sectionSize || "14pt"), color: secHeadColor })] })],
        }));
        splitParas(sec.content).forEach(p => main.push(bodyPara(p)));
        (sec.subsections || []).forEach((sub, sbi) => {
          main.push(new Paragraph({
            alignment: AlignmentType.LEFT, outlineLevel: 2, spacing: { before: 200, after: 60 },
            children: [new Bookmark({ id: `bmCh_${i}_s${si}_ss${sbi}`, children: [new TextRun({ text: `${sub.number} ${sub.heading}`, bold: true, allCaps: !!tpl.sectionCaps, font: headFont, size: ptHalf(tpl.sectionSize || "14pt"), color: secHeadColor })] })],
          }));
          splitParas(sub.content).forEach(p => main.push(bodyPara(p)));
        });
      });
    });
    if (references.length) {
      main.push(new Paragraph({ alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 200 }, children: [new Bookmark({ id: "bmRefs", children: [new TextRun({ text: tpl.apaStrict ? (tpl.referencesLabel || "References") : "REFERENCES", bold: true, allCaps: !tpl.apaStrict, font: headFont, size: ptHalf(tpl.chapterTitleSize || "16pt"), color: "000000" })] })] }));
      references.forEach((ref, i) => main.push(new Paragraph({
        alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0, line: lineTwips(tpl.refLineHeight || 1.0), lineRule: LineRuleType.AUTO },
        indent: { left: 480, hanging: 480 },
        children: [new TextRun({ text: tpl.apaStrict ? ref : `${i + 1}. ${ref}`, font: bodyFont, size: ptHalf(tpl.refFontSize || "11pt") })],
      })));
    }

    const pageDef = { size: { width: mmTwip(210), height: mmTwip(297) } };
    const cmar = tpl.coverMargins || {};
    const bmar = { top: lenTwip(tpl.margins.top || "3.2cm"), bottom: lenTwip(tpl.margins.bottom || "2.5cm"), left: mmTwip(leftMm), right: mmTwip(rightMm) };
    const footer = (fmt) => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: bodyFont, size: 22 })] })] });
    return new Document({
      creator: "Academic Writing Suite",
      title: cover.title || "Thesis",
      features: { updateFields: true },
      sections: [
        // Cover — counts as 'i' but no footer shown
        { properties: { page: { ...pageDef, margin: { top: lenTwip(cmar.top || "2.5cm"), bottom: lenTwip(cmar.bottom || "2.5cm"), left: lenTwip(cmar.left || "2.5cm"), right: lenTwip(cmar.right || "2.5cm") }, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } }, children: coverKids },
        // Front matter — roman numerals ii, iii, …
        { properties: { page: { ...pageDef, margin: bmar, pageNumbers: { formatType: NumberFormat.LOWER_ROMAN } } }, footers: { default: footer() }, children: fm.length ? fm : [new Paragraph({ text: "" })] },
        // Main body — arabic, restart at 1
        { properties: { page: { ...pageDef, margin: bmar, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } }, footers: { default: footer() }, children: main.length ? main : [new Paragraph({ text: "" })] },
      ],
    });
  }

  // ── BODY children ──
  const body = [];
  const pushPrelim = (title, text, sig) => {
    if (!text) return;
    body.push(sectionTitle(title, { breakBefore: body.length > 0 }));
    splitParas(text).forEach(p => body.push(prelimBodyPara(p)));
    if (sig) sigPara(sig).forEach(p => body.push(p));
  };

  if (preliminary.abstract) {
    body.push(sectionTitle(L.abstract, { breakBefore: body.length > 0 }));
    splitParas(preliminary.abstract).forEach(p => body.push(bodyPara(p)));
  }
  pushPrelim(L.acknowledgement, preliminary.acknowledgement, cover.authorName);
  pushPrelim(L.dedication, preliminary.dedication, cover.authorName);
  pushPrelim(L.declaration, preliminary.declaration, cover.authorName);

  if (preliminary.includeToc) {
    body.push(sectionTitle(isUrdu ? "فہرستِ مضامین" : "TABLE OF CONTENTS", { breakBefore: body.length > 0 }));
    const rightTab = convertMillimetersToTwip(210 - leftMm - rightMm);
    const tocEntry = (label, lvl) => new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: rightTab, leader: LeaderType.DOT }],
      indent: { left: lvl * 260 },
      spacing: { before: lvl === 0 ? 140 : 30, after: 0, line: 300, lineRule: LineRuleType.AUTO },
      children: [new TextRun({ text: label, bold: lvl === 0, font: bodyFont, size: ptHalf(lvl === 0 ? tpl.bodyFontSize : (tpl.refFontSize || "11pt")) })],
    });
    if (preliminary.abstract) body.push(tocEntry(L.abstract, 0));
    if (preliminary.acknowledgement) body.push(tocEntry(L.acknowledgement, 0));
    if (preliminary.dedication) body.push(tocEntry(L.dedication, 0));
    if (preliminary.declaration) body.push(tocEntry(L.declaration, 0));
    chapters.forEach((ch, i) => {
      const chNum = String(ch.chapterNo || i + 1).padStart(2, "0");
      body.push(tocEntry(isUrdu ? `${URDU_LABELS.chapter} ${i + 1} — ${ch.title || ""}` : `CHAPTER ${chNum} — ${ch.title || "(Untitled)"}`, 0));
      (ch.sections || []).forEach((sec) => {
        body.push(tocEntry(`${sec.number} ${sec.heading}`, 1));
        (sec.subsections || []).forEach((sub) => body.push(tocEntry(`${sub.number} ${sub.heading}`, 2)));
      });
    });
    if (references.length) body.push(tocEntry((!isUrdu && tpl.referencesLabel) ? tpl.referencesLabel : L.references, 0));
  }

  // ── Automatic List of Tables / List of Figures (all templates) ──────────────
  // Built from every captioned table / figure across the chapters.
  {
    const wantFM = (v) => v !== false;
    const rightTab2 = convertMillimetersToTwip(210 - leftMm - rightMm);
    const allTbl = [], allFig = [];
    chapters.forEach((ch) => chapterBlocks(ch).forEach((b) => {
      if (b.type === "table" && (b.caption || b.label)) allTbl.push(b);
      if (b.type === "figure" && (b.caption || b.label)) allFig.push(b);
    }));
    const listEntry = (label) => new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: rightTab2, leader: LeaderType.DOT }],
      spacing: { before: 30, after: 0, line: 300, lineRule: LineRuleType.AUTO },
      children: [new TextRun({ text: label, font: bodyFont, size: ptHalf(tpl.refFontSize || tpl.bodyFontSize || "12pt") })],
    });
    if (wantFM(preliminary.includeListOfTables) && allTbl.length) {
      body.push(sectionTitle(isUrdu ? "فہرستِ جداول" : "LIST OF TABLES", { breakBefore: true }));
      allTbl.forEach((b, i) => body.push(listEntry((b.caption || b.label || `Table ${i + 1}`).trim())));
    }
    if (wantFM(preliminary.includeListOfFigures) && allFig.length) {
      body.push(sectionTitle(isUrdu ? "فہرستِ تصاویر" : "LIST OF FIGURES", { breakBefore: true }));
      allFig.forEach((b, i) => body.push(listEntry(`${b.label || `Figure ${i + 1}`} ${b.caption || ""}`.trim())));
    }
  }

  chapters.forEach((ch, i) => {
    const chNum = String(ch.chapterNo || i + 1).padStart(2, "0");
    const label = isUrdu ? `${URDU_LABELS.chapter} ${i + 1}` : `CHAPTER ${chNum}`;
    body.push(chapterNumPara(label));
    body.push(chapterTitlePara(ch.title));
    if (ch.epigraph) body.push(epigraphPara(ch.epigraph));
    chapterBlocks(ch).forEach(b => {
      if (b.type === "figure") figureParas(b).forEach(p => body.push(p));
      else if (b.type === "table") tableParas(b).forEach(p => body.push(p));
      else splitParas(b.content).forEach(p => body.push(bodyPara(p)));
    });
    (ch.sections || []).forEach(sec => {
      body.push(secHeadPara(sec.number, sec.heading, false));
      splitParas(sec.content).forEach(p => body.push(bodyPara(p)));
      (sec.subsections || []).forEach(sub => {
        body.push(secHeadPara(sub.number, sub.heading, true));
        splitParas(sub.content).forEach(p => body.push(bodyPara(p)));
      });
    });
  });

  if (references.length) {
    body.push(sectionTitle(L.references, { breakBefore: true }));
    references.forEach((ref, i) => body.push(new Paragraph({
      alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: lineTwips(tpl.refLineHeight || 1.0), lineRule: LineRuleType.AUTO },
      indent: isRTL ? { right: 720, hanging: 720 } : { left: 720, hanging: 720 },
      children: [new TextRun({ text: tpl.numberedReferences ? `[${i + 1}] ${ref}` : ref, font: bodyFont, size: ptHalf(tpl.refFontSize || "11pt") })],
    })));
  }

  const page = { size: { width: mmTwip(210), height: mmTwip(297) } };
  const cm = tpl.coverMargins || {};
  return new Document({
    creator: "Academic Writing Suite",
    title: cover.title || "Thesis",
    features: { updateFields: true },
    sections: [
      {
        properties: { page: { ...page, margin: { top: lenTwip(cm.top || "2.5cm"), bottom: lenTwip(cm.bottom || "2.5cm"), left: lenTwip(cm.left || "2.5cm"), right: lenTwip(cm.right || "2.5cm") } } },
        children: coverKids,
      },
      {
        properties: { page: { ...page, margin: { top: lenTwip(tpl.margins.top || "3.2cm"), bottom: lenTwip(tpl.margins.bottom || "2.5cm"), left: mmTwip(leftMm), right: mmTwip(rightMm) } } },
        children: body.length ? body : [new Paragraph({ text: "" })],
      },
    ],
  });
}

export async function downloadThesisDocx(data, filename = "thesis.docx", templateId = "hec_standard") {
  const doc = buildThesisDocx(data, templateId);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".docx") ? filename : filename.replace(/\.docx?$/i, "") + ".docx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
