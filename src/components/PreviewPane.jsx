/**
 * PreviewPane.jsx  v3
 * Template-aware A4 preview — supports all HEC formats + Urdu RTL.
 */
import { useRef, useState, useLayoutEffect, useMemo } from "react";
import { TEMPLATES, URDU_LABELS } from "../data/themeTemplates";
import { chapterBlocks, nodeBlocks } from "../utils/chapterBlocks";
import { aiouPhdPageTexts, isArabicLine } from "../utils/aiouPhdPages";
import { getCitationStyle, styledReferenceList } from "../utils/citationStyles";
import { isBlockQuote, BLOCK_QUOTE_INDENT } from "../utils/blockQuote";

function getFont(tpl, type = "body") {
  const f = tpl.fonts?.[type] || tpl.fonts?.body || "Times New Roman";
  const fallback = tpl.fonts?.fallback || "";
  return `'${f}', ${fallback || "'Times New Roman', Times, serif"}`;
}

function useTemplate(templateId) {
  return TEMPLATES[templateId] || TEMPLATES.hec_standard;
}

// ── Core style builders ───────────────────────────────────────────────────────
function bodyStyle(tpl) {
  return {
    fontFamily: getFont(tpl),
    fontSize: tpl.bodyFontSize || "12pt",
    lineHeight: tpl.bodyLineHeight || 1.5,
    textAlign: tpl.direction === "rtl" ? "right" : (tpl.apaStrict ? "left" : "justify"),
    textIndent: tpl.paraIndent || 0,
    marginTop: "12pt",
    marginBottom: 0,
    direction: tpl.direction || "ltr",
  };
}

// A quotation of more than 40 words is set in from both margins and single
// spaced, instead of running on inside the paragraph.
const blockQuoteStyle = (txt) => (isBlockQuote(txt) ? {
  marginLeft: BLOCK_QUOTE_INDENT,
  marginRight: BLOCK_QUOTE_INDENT,
  textIndent: 0,
  lineHeight: 1.0,
  // A blank line separates the quotation from the text above and below it.
  marginTop: "24pt",
  marginBottom: "12pt",
} : null);

// ── Component helpers ─────────────────────────────────────────────────────────
function BodyParas({ text, tpl, style = {} }) {
  return (text || "").split("\n").filter(l => l.trim()).map((p, i) => (
    <p key={i} style={{ ...bodyStyle(tpl), ...blockQuoteStyle(p), ...style }}>{p}</p>
  ));
}

function Page({ tpl, paddingStyle, children, last, fixed, footer }) {
  return (
    <div className="thesis-page" style={{
      background: "#fff",
      color: "#000",
      width: "21cm",
      height: fixed ? "29.7cm" : undefined,
      minHeight: fixed ? undefined : "29.7cm",
      overflow: fixed ? "hidden" : undefined,
      boxSizing: "border-box",
      margin: "0 auto 22px",
      boxShadow: "0 8px 48px rgba(0,0,0,0.45)",
      direction: tpl.direction,
      position: "relative",
      ...paddingStyle,
      breakAfter: last ? "auto" : "page",
      pageBreakAfter: last ? "auto" : "always",
    }}>
      {children}
      {footer != null && footer !== "" && (
        <div style={{ position: "absolute", bottom: "1.2cm", left: 0, right: 0, textAlign: "center", fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", color: "#000" }}>{footer}</div>
      )}
    </div>
  );
}

function toRomanLower(n) {
  const map = [[1000,"m"],[900,"cm"],[500,"d"],[400,"cd"],[100,"c"],[90,"xc"],[50,"l"],[40,"xl"],[10,"x"],[9,"ix"],[5,"v"],[4,"iv"],[1,"i"]];
  let x = n, s = "";
  for (const [v, r] of map) while (x >= v) { s += r; x -= v; }
  return s;
}

// Convert a CSS length string to pixels (96dpi) for height measurement.
function lenToPx(s) {
  if (typeof s !== "string") return Number(s) || 0;
  const v = parseFloat(s);
  if (s.endsWith("cm")) return v * 37.7952755906;
  if (s.endsWith("mm")) return v * 3.77952755906;
  if (s.endsWith("in")) return v * 96;
  if (s.endsWith("pt")) return v * 96 / 72;
  return v;
}

/**
 * FlowPaginator — measures a flat list of content blocks and packs them into
 * fixed-height A4 pages, so a long chapter continues onto the next page instead
 * of stretching one page. `breakBefore` forces a block to start a new page.
 */
function FlowPaginator({ blocks, tpl, paddingStyle, sig, onPages }) {
  const measureRef = useRef(null);
  const [state, setState] = useState({ sig: null, pages: null });

  const A4H = 29.7 * 37.7952755906;
  const A4W = 21 * 37.7952755906;
  const contentH = A4H - lenToPx(paddingStyle.paddingTop) - lenToPx(paddingStyle.paddingBottom) - 4;
  const contentW = A4W - lenToPx(paddingStyle.paddingLeft) - lenToPx(paddingStyle.paddingRight);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const recompute = () => {
      const kids = Array.from(el.children);
      const hs = kids.map(k => k.offsetHeight);
      const out = [];
      let cur = [], h = 0;
      blocks.forEach((b, i) => {
        const bh = hs[i] || 0;
        if (cur.length && (b.breakBefore || h + bh > contentH)) { out.push(cur); cur = []; h = 0; }
        // keep-with-next: a heading must not be the last thing on a page. If this
        // block wants to stay with what follows and the next block won't fit
        // beside it, push the heading to the next page too.
        if (b.keepWithNext && cur.length && i + 1 < blocks.length) {
          const nh = hs[i + 1] || 0;
          if (h + bh + nh > contentH) { out.push(cur); cur = []; h = 0; }
        }
        cur.push(i); h += bh;
      });
    if (cur.length) out.push(cur);
      setState(prev => {
        const key = out.map(p => p.join(",")).join(";");
        const prevKey = (prev.sig === sig && prev.pages) ? prev.pages.map(p => p.join(",")).join(";") : null;
        if (prev.sig === sig && key === prevKey) return prev;
        return { sig, pages: out };
      });
      if (onPages) onPages(out);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    Array.from(el.children).forEach(c => ro.observe(c));
    window.addEventListener("resize", recompute);
    return () => { ro.disconnect(); window.removeEventListener("resize", recompute); };
   }, [sig, contentH, contentW, blocks.length]);// eslint-disable-line react-hooks/exhaustive-deps

const pageList = (state.sig === sig && state.pages && state.pages.every(p => p.every(i => i < blocks.length)))
    ? state.pages
    : (blocks.length ? [blocks.map((_, i) => i)] : []);
  // AIOU page numbering: roman for front matter (after cover 'i'), arabic restart at chapters.
  const aiou = tpl.variantGroup === "aiou";

  let firstChapterPage = null;
if (aiou) pageList.forEach((idxs, pi) => { if (firstChapterPage == null && idxs.some(i => blocks[i]?.key === "ch0-head")) firstChapterPage = pi; });
  const footerFor = (pi) => {
    if (!aiou) return null;
    if (firstChapterPage == null) return toRomanLower(pi + 2);
    if (pi < firstChapterPage) return toRomanLower(pi + 2);
    return String(pi - firstChapterPage + 1);
  };

  return (
    <>
      {/* hidden measuring layer — exact content width so heights match the page */}
      <div ref={measureRef} aria-hidden style={{
        position: "absolute", left: "-100000px", top: 0, width: contentW + "px",
        visibility: "hidden", pointerEvents: "none",
        fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, direction: tpl.direction,
      }}>
              {blocks.map(b => b && <div key={b.key} style={{ display: "flow-root" }}>{b.el}</div>)}

      </div>
      {pageList.map((idxs, pi) => (
        <Page key={pi} tpl={tpl} paddingStyle={paddingStyle} fixed last={pi === pageList.length - 1} footer={footerFor(pi)}>
                    {idxs.filter(i => blocks[i]).map(i => <div key={blocks[i].key} style={{ display: "flow-root" }}>{blocks[i].el}</div>)}

        </Page>
      ))}
    </>
  );
}

function PrelimTitle({ text, tpl }) {
  return (
    <p style={{
      fontFamily: getFont(tpl, "heading"),
      fontSize: tpl.chapterTitleSize || "12pt",
      fontWeight: "bold",
      textTransform: tpl.apaStrict ? "none" : "uppercase",
      textAlign: "center",
      marginBottom: "24pt",
      lineHeight: 1.0,
      marginTop: 0,
      color: "#000",
      direction: tpl.direction,
    }}>{text}</p>
  );
}

function PrelimSection({ title, body, signature, tpl }) {
  const isRTL = tpl.direction === "rtl";
  return (
    <div>
      <PrelimTitle text={title} tpl={tpl} />
      <BodyParas text={body} tpl={tpl} style={{ fontSize: tpl.refFontSize || "11pt" }} />
      {signature && (
        <p style={{
          fontFamily: getFont(tpl),
          fontSize: tpl.refFontSize || "11pt",
          textAlign: isRTL ? "left" : "right",
          marginTop: "48pt",
          direction: tpl.direction,
        }}>
          ({signature})<br />
          <span style={{ color: "#aaa", fontSize: "9pt" }}>
            {isRTL ? "تاریخ: _____________" : "Date: _______________"}
          </span>
        </p>
      )}
    </div>
  );
}

function ThesisTable({ table, tpl }) {
  const lastIdx = (table.rows || []).length - 1;
  const isRTL = tpl.direction === "rtl";
  return (
    <div style={{ margin: "20pt 0", direction: tpl.direction }}>
      <p style={{
        fontFamily: getFont(tpl, "heading"),
        fontSize: tpl.bodyFontSize,
        fontWeight: "bold",
        textAlign: isRTL ? "right" : "justify",
        marginBottom: "4pt",
        marginTop: "12pt",
        color: tpl.colors.coverAccent,
      }}>{table.caption}</p>
      <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: getFont(tpl), fontSize: tpl.refFontSize }}>
        <thead>
          <tr>{(table.headers || []).map((h, i) => (
            <th key={i} style={{ borderTop: `1.5pt solid ${tpl.colors.ruleColor}`, borderBottom: `1.5pt solid ${tpl.colors.ruleColor}`, padding: "4pt 8pt", fontWeight: "bold", textAlign: "center" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>{(table.rows || []).map((row, ri) => (
          <tr key={ri}>{row.map((cell, ci) => (
            <td key={ci} style={{ padding: "4pt 8pt", borderBottom: ri === lastIdx ? `1.5pt solid ${tpl.colors.ruleColor}` : "none", textAlign: isRTL ? "right" : "left" }}>{cell}</td>
          ))}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function ThesisFigure({ figure, tpl }) {
  const isRTL = tpl.direction === "rtl";
  const figLabel = tpl.language === "urdu"
    ? `${URDU_LABELS.figure} ${figure.label?.replace("Figure", "").replace(":", "").trim()}:`
    : figure.label;
  return (
    <div style={{ margin: "20pt 0", direction: tpl.direction }}>
      {figure.imageData ? (
        // The width set by dragging the figure's corner in the editor (25–100%).
        <img src={figure.imageData} alt={figure.caption || "Figure"} style={{ display: "block", maxWidth: "100%", width: `${Math.min(100, Math.max(25, Number(figure.widthPct) || 100))}%`, margin: "0 auto 4pt", objectFit: "contain" }} />
      ) : (
        <div style={{ border: "1pt dashed #ccc", height: "5cm", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: getFont(tpl), fontSize: "11pt", color: "#aaa", fontStyle: "italic", marginBottom: "4pt" }}>
          {tpl.language === "urdu" ? "[تصویر — یہاں تصویر داخل کریں]" : "[Figure — Upload an image in the editor]"}
        </div>
      )}
      <p style={{ fontFamily: getFont(tpl), fontSize: tpl.refFontSize, lineHeight: 1.0, textAlign: isRTL ? "right" : "justify", marginTop: "4pt", direction: tpl.direction }}>
        <strong>{figLabel}</strong>{" "}{figure.caption}{figure.description ? `: ${figure.description}` : ""}
      </p>
    </div>
  );
}

// ── Chapter Block ─────────────────────────────────────────────────────────────
function ChapterBlock({ chapter, idx, tpl }) {
  const chNum    = String(chapter.chapterNo || idx + 1).padStart(2, "0");
  const isRTL    = tpl.direction === "rtl";
  const isUrdu   = tpl.language === "urdu";
  const chLabel  = isUrdu ? `${URDU_LABELS.chapter} ${convertToUrduNumeral(idx + 1)}` : `CHAPTER ${chNum}`;

  return (
    <div style={{ direction: tpl.direction }}>
      {/* Chapter number */}
      <p style={{
        fontFamily: getFont(tpl, "heading"),
        fontSize: tpl.chapterNumSize,
        fontWeight: "bold",
        textDecoration: tpl.apaStrict ? "none" : "underline",
        textTransform: (isUrdu || tpl.apaStrict) ? "none" : "uppercase",
        textAlign: tpl.apaStrict ? "center" : (tpl.chapterNumAlign || (isRTL ? "left" : "right")),
        marginBottom: "4pt",
        lineHeight: 1.0,
        color: tpl.colors.coverAccent,
      }}>{chLabel}</p>

      {/* Chapter title */}
      <p style={{
        fontFamily: getFont(tpl, "heading"),
        fontSize: tpl.chapterTitleSize,
        fontWeight: "bold",
        textTransform: (isUrdu || tpl.apaStrict) ? "none" : "uppercase",
        textAlign: "center",
        lineHeight: isUrdu ? 1.6 : (tpl.apaStrict ? tpl.bodyLineHeight : 1.0),
        marginBottom: "8pt",
        marginTop: 0,
        color: tpl.colors.coverTitle,
      }}>{chapter.title || "(Chapter Title)"}</p>

      {/* Epigraph */}
      {chapter.epigraph && (
        <p style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, fontStyle: "italic", textAlign: "center", margin: "24pt 0", direction: tpl.direction }}>
          {chapter.epigraph}
        </p>
      )}

      {/* Inline content blocks — text, figures and tables in the order added */}
      {chapterBlocks(chapter).map((b) =>
        b.type === "figure" ? <ThesisFigure key={b.id} figure={b} tpl={tpl} />
        : b.type === "table" ? <ThesisTable key={b.id} table={b} tpl={tpl} />
        : <BodyParas key={b.id} text={b.content} tpl={tpl} />
      )}

      {/* Sections */}
      {(chapter.sections || []).map((sec, si) => (
        <div key={si}>
          <p style={{
            fontFamily: getFont(tpl, "heading"),
            fontSize: tpl.sectionSize,
            fontWeight: "bold",
            textAlign: isRTL ? "right" : "left",
            lineHeight: 1.0,
            marginTop: "16pt",
            marginBottom: "4pt",
            color: tpl.colors.coverAccent,
          }}>{sec.number} {sec.heading}</p>
          <BodyParas text={sec.content} tpl={tpl} />
          {(sec.subsections || []).map((sub, sbi) => (
            <div key={sbi}>
              <p style={{
                fontFamily: getFont(tpl, "heading"),
                fontSize: tpl.sectionSize,
                fontWeight: "bold",
                textAlign: isRTL ? "right" : "left",
                lineHeight: 1.0,
                marginTop: "14pt",
                marginBottom: "4pt",
                color: tpl.colors.coverAccent,
              }}>{sub.number} {sub.heading}</p>
              <BodyParas text={sub.content} tpl={tpl} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Urdu numeral converter ────────────────────────────────────────────────────
function convertToUrduNumeral(n) {
  const urduDigits = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
  return String(n).split("").map(d => urduDigits[parseInt(d)] ?? d).join("");
}

const NUM_WORDS_EN = ["ZERO","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN",
  "ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN","TWENTY"];
function numWordEN(n) { return NUM_WORDS_EN[n] || String(n); }

// ── Cover Page (template-aware) ───────────────────────────────────────────────
// ── UoG ASRB 2022 Official Cover Page ─────────────────────────────────────────
// Exact per handbook clauses 1.9.1 (outer hard binding cover) and 1.9.3 (front page)
function UoGCoverPage({ cover }) {
  const TNR = { fontFamily: "'Times New Roman', Times, serif" };
  const rule = <div style={{ width: "1.5cm", height: "1.5pt", background: "#000", margin: "6pt auto" }} />;

  return (
    <div style={{ ...TNR, textAlign: "center" }}>
      {/* Clause 1.9.1.2 / 1.9.3.1: Title 16pt Bold ALL CAPS, 1.5 spacing */}
      <p style={{
        ...TNR, fontSize: "16pt", fontWeight: "bold", textTransform: "uppercase",
        lineHeight: 1.5, marginBottom: "4pt",
      }}>
        {cover.title || "THESIS/DISSERTATION TITLE"}
      </p>
      {/* Clause 1.9.1.3 / 1.9.3.2: 1.5cm rule below title */}
      {rule}

      {/* Clause 1.9.3.3: submission statement 14pt bold */}
      <p style={{ ...TNR, fontSize: "14pt", fontWeight: "bold", marginTop: "10pt" }}>
        A Thesis submitted in Partial Fulfillment of the Requirements for the Award of Degree of
      </p>

      {/* Clause 1.9.1.6 / 1.9.3.4: degree title 14pt bold */}
      <p style={{ ...TNR, fontSize: "14pt", fontWeight: "bold", marginTop: "6pt" }}>
        {cover.degree || "MPhil/MS/PhD/BS/MSc"}
      </p>
      <p style={{ ...TNR, fontSize: "14pt", marginTop: "2pt" }}>In</p>
      {/* Clause 1.9.3.5: subject 14pt bold */}
      <p style={{ ...TNR, fontSize: "14pt", fontWeight: "bold", marginTop: "2pt" }}>
        {cover.subject || "[Subject]"}
      </p>

      <p style={{ ...TNR, fontSize: "14pt", fontWeight: "bold", marginTop: "14pt" }}>BY</p>

      {/* Clause 1.9.1.4 / 1.9.3.6: Author name 14pt bold ALL CAPS */}
      <p style={{ ...TNR, fontSize: "14pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "4pt" }}>
        {cover.authorName || "NAME OF SCHOLAR"}
      </p>

      {/* Clause 1.9.1.5 / 1.9.3.7: Registration number 14pt bold ALL CAPS */}
      {cover.registrationNo && (
        <p style={{ ...TNR, fontSize: "14pt", fontWeight: "bold", marginTop: "4pt" }}>
          REGISTRATION # {cover.registrationNo}
        </p>
      )}

      {/* Clause 1.9.1.7 / 1.9.3.8: Department 14pt bold first letter capital */}
      <p style={{ ...TNR, fontSize: "14pt", fontWeight: "bold", marginTop: "14pt" }}>
        {cover.department || "Department of [Subject]"}
      </p>

      {/* Clause 1.9.1.8: Logo container 4.2cm × 5.57cm, 1 line space above/below */}
      <div style={{ marginTop: "8pt", marginBottom: "4pt" }}>
        {cover.logo ? (
          <img src={cover.logo} alt="University logo"
            style={{ width: "5.57cm", height: "4.2cm", objectFit: "contain", display: "block", margin: "0 auto" }} />
        ) : (
        <div style={{
          width: "5.57cm", height: "4.2cm",
          border: "1pt solid #000", borderRadius: "4px",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto",
          ...TNR, fontSize: "9pt", color: "#888", fontStyle: "italic",
        }}>
          [University Logo 4.2×5.57 cm]
        </div>
        )}
      </div>
      {/* Clause 1.9.1.9 / 1.9.3.10: 1.5cm line below the image */}
      {rule}

      {/* Clause 1.9.1.10 / 1.9.3.11: University name 14pt bold ALL CAPS */}
      <p style={{ ...TNR, fontSize: "14pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "4pt" }}>
        {cover.university || "UNIVERSITY OF GUJRAT"}
      </p>

      {/* Clause 1.9.1.11 / 1.9.3.12: Session 14pt bold first letter capital */}
      {cover.session && (
        <p style={{ ...TNR, fontSize: "14pt", fontWeight: "bold", marginTop: "4pt" }}>
          Session {cover.session}
        </p>
      )}
    </div>
  );
}

// ── UoG Completion Certificate (Clause 1.9.7) ────────────────────────────────
function UoGCompletionCertificate({ cover }) {
  const TNR = { fontFamily: "'Times New Roman', Times, serif" };
  const SigBlock = ({ label }) => (
    <div style={{ marginTop: "24pt" }}>
      <div style={{ width: "5cm", height: "1pt", background: "#000", marginBottom: "4pt" }} />
      <p style={{ ...TNR, fontSize: "11pt", textAlign: "left", margin: 0 }}>{label}</p>
      <p style={{ ...TNR, fontSize: "11pt", textAlign: "left", color: "#555", margin: 0 }}>Designation,</p>
      <p style={{ ...TNR, fontSize: "11pt", textAlign: "left", color: "#555", margin: 0 }}>{cover.university || "University of Gujrat"}, Punjab, Pakistan</p>
      <p style={{ ...TNR, fontSize: "11pt", textAlign: "left", color: "#555", margin: 0 }}>Email: _________________________</p>
    </div>
  );
  return (
    <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: "24pt", marginTop: "24pt" }}>
      <p style={{ ...TNR, fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", textAlign: "center", marginBottom: "16pt" }}>
        THESIS COMPLETION CERTIFICATE
      </p>
      <p style={{ ...TNR, fontSize: "11pt", lineHeight: 1.5, textAlign: "justify" }}>
        It is certified that this thesis titled "{cover.title || "[THESIS TITLE]"}" submitted by {cover.authorName || "[Scholar Name]"}, roll # {cover.registrationNo || "[Roll No]"}, {cover.degree || "[Degree]"} scholar, {cover.department || "[Department]"}, Faculty of {cover.faculty || "[Faculty]"}, {cover.university || "University of Gujrat"}, Pakistan is evaluated and accepted for the award of degree "{cover.degree || "[Degree]"}" in {cover.subject || "[Subject]"} by the following members of the Thesis/Dissertation Viva Voce Examination Committee.
      </p>
      <p style={{ ...TNR, fontSize: "11pt", lineHeight: 1.5, textAlign: "justify", marginTop: "12pt" }}>
        The evaluation report is available in the Directorate of Advance Studies and Research Board of the University.
      </p>
      <SigBlock label="Name & Signature of the External Examiner" />
      <SigBlock label={`Name & Signature of the Research Supervisor${cover.supervisor ? ` (${cover.supervisor})` : ""}`} />
      <div style={{ marginTop: "24pt" }}>
        <div style={{ width: "5cm", height: "1pt", background: "#000", marginBottom: "4pt" }} />
        <p style={{ ...TNR, fontSize: "11pt", textAlign: "left", margin: 0 }}>Name & Signature of the Chairperson/HOD</p>
        <p style={{ ...TNR, fontSize: "11pt", textAlign: "left", color: "#555", margin: 0 }}>Designation,</p>
        <p style={{ ...TNR, fontSize: "11pt", textAlign: "left", color: "#555", margin: 0 }}>{cover.university || "University of Gujrat"}, Punjab, Pakistan</p>
        <p style={{ ...TNR, fontSize: "11pt", textAlign: "left", color: "#555", margin: 0 }}>Email: _________________________ &nbsp; Dated: ____________</p>
      </div>
    </div>
  );
}

// ── UoG Certificate of Plagiarism (Clause 1.9.8) ─────────────────────────────
function UoGPlagiarismCertificate({ cover }) {
  const TNR = { fontFamily: "'Times New Roman', Times, serif" };
  const points = [
    "Thesis has significant new work/knowledge as compared already published or are under consideration to be published elsewhere. No sentence, equation, diagram, table, paragraph, or section has been copied verbatim from previous work unless it is placed under quotation marks and duly referenced.",
    "The work presented is original and own work of the author (i.e. there is no plagiarism). No ideas, processes, results, or words of others have been presented as Author own work.",
    "There is no fabrication of data or results which have been compiled/analyzed.",
    "There is no falsification by manipulating research materials, equipment, or processes, or changing or omitting data or results such that the research is not accurately represented in the research record.",
    "The thesis has been checked using TURNITIN (copy of originality report attached) and found within limits as per HEC plagiarism Policy and instructions issued from time to time.",
    "While generating the Turnitin report, nothing has been excluded from Abstract to Conclusion parts of the thesis.",
  ];
  return (
    <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: "24pt", marginTop: "24pt" }}>
      <p style={{ ...TNR, fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", textAlign: "center", marginBottom: "16pt" }}>
        CERTIFICATE OF PLAGIARISM
      </p>
      <p style={{ ...TNR, fontSize: "12pt", lineHeight: 1.5, textAlign: "justify", marginBottom: "12pt" }}>
        It is certified that {cover.degree || "PhD/M.Phil/MS"} Thesis Titled "{cover.title || "[THESIS TITLE]"}" by {cover.authorName || "[Name of Scholar]"} has been examined by us. We undertake the following:
      </p>
      {points.map((pt, i) => (
        <p key={i} style={{ ...TNR, fontSize: "12pt", lineHeight: 1.5, textAlign: "justify", marginTop: "8pt", paddingLeft: "20pt" }}>
          <strong>{String.fromCharCode(97 + i)}.</strong> {pt}
        </p>
      ))}
      <div style={{ display: "flex", gap: "3cm", marginTop: "32pt" }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: "5cm", height: "1pt", background: "#000", marginBottom: "4pt" }} />
          <p style={{ ...TNR, fontSize: "11pt", margin: 0 }}>Name & Signature of the Research Scholar</p>
          <p style={{ ...TNR, fontSize: "11pt", color: "#555", margin: 0 }}>Roll No. _______</p>
          <p style={{ ...TNR, fontSize: "11pt", color: "#555", margin: 0 }}>Department ______</p>
          <p style={{ ...TNR, fontSize: "11pt", color: "#555", margin: 0 }}>{cover.university || "University of Gujrat"}, Punjab, Pakistan</p>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: "5cm", height: "1pt", background: "#000", marginBottom: "4pt" }} />
          <p style={{ ...TNR, fontSize: "11pt", margin: 0 }}>Name & Signature of the Research Supervisor</p>
          <p style={{ ...TNR, fontSize: "11pt", color: "#555", margin: 0 }}>{cover.supervisor || "[Supervisor Name]"}</p>
          <p style={{ ...TNR, fontSize: "11pt", color: "#555", margin: 0 }}>Designation,</p>
          <p style={{ ...TNR, fontSize: "11pt", color: "#555", margin: 0 }}>{cover.university || "University of Gujrat"}, Punjab, Pakistan</p>
          <p style={{ ...TNR, fontSize: "11pt", color: "#555", margin: 0 }}>Email: _________________________</p>
        </div>
      </div>
    </div>
  );
}

// ── UoG ToC (Clause 1.9.9 — 3-row 2-col table, horizontal borders only, 1.5cm) ──
function UoGTableOfContents({ chapters, references }) {
  const TNR = { fontFamily: "'Times New Roman', Times, serif" };
  const borderStyle = "1.5pt solid #000";
  const rows = [
    ["ACKNOWLEDGEMENT", "(ii)"],
    ["DEDICATION", "(iii)"],
    ["DECLARATION", "(iv)"],
    ["ABSTRACT", "01"],
    ...(chapters || []).map((ch, i) => [
      `CHAPTER ${String(ch.chapterNo || i + 1).padStart(2, "0")}: ${(ch.title || "").toUpperCase()}`,
      String(i + 2).padStart(2, "0")
    ]),
    ["REFERENCES", String((chapters?.length || 0) + 2).padStart(2, "0")],
    ["APPENDICES", String((chapters?.length || 0) + 3).padStart(2, "0")],
  ];

  return (
    <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: "24pt", marginTop: "24pt" }}>
      <table style={{
        width: "100%", borderCollapse: "collapse",
        ...TNR, fontSize: "11pt"
      }}>
        <thead>
          <tr>
            <th colSpan="2" style={{
              borderTop: borderStyle, borderBottom: borderStyle,
              textAlign: "center", padding: "4pt 8pt",
              fontSize: "11pt", fontWeight: "bold", textTransform: "uppercase",
            }}>
              TABLE OF CONTENTS
            </th>
          </tr>
          <tr>
            <th style={{ borderBottom: borderStyle, padding: "4pt 8pt", textAlign: "center", fontWeight: "bold", textTransform: "uppercase" }}>CONTENTS</th>
            <th style={{ borderBottom: borderStyle, padding: "4pt 8pt", textAlign: "center", fontWeight: "bold", textTransform: "uppercase", width: "2.5cm" }}>PAGE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{
                padding: "3pt 8pt", fontSize: "11pt",
                borderBottom: i === rows.length - 1 ? borderStyle : "none",
              }}>
                {row[0]}{"·".repeat(50)}
              </td>
              <td style={{
                padding: "3pt 8pt", fontSize: "11pt", textAlign: "center",
                borderBottom: i === rows.length - 1 ? borderStyle : "none",
              }}>
                {row[1]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── AIOU (Allama Iqbal Open University) Cover Page ────────────────────────────
// Per AIOU Research Project / Thesis Guidelines (Project Layout §2 — Title Page).
function AIOUCoverPage({ cover, tpl }) {
  const TNR = { fontFamily: "'Times New Roman', Times, serif", color: "#000" };
  const L = (txt, st) => <p style={{ ...TNR, ...st }}>{txt}</p>;
  return (
    <div style={{ ...TNR, textAlign: "center", paddingTop: "1cm" }}>
      {L(cover.title || "THESIS TITLE", { fontSize: tpl.coverTitleSize || "16pt", fontWeight: "bold", textTransform: "uppercase", lineHeight: 1.5, maxWidth: "92%", margin: "0 auto 26pt" })}

      {tpl.showLogo !== false && (
        cover.logo
          ? <img src={cover.logo} alt="University logo" style={{ width: "4cm", height: "4cm", objectFit: "contain", display: "block", margin: "0 auto 26pt" }} />
          : <p style={{ ...TNR, fontSize: "10pt", fontStyle: "italic", color: "#888", margin: "0 auto 26pt" }}>[University Emblem]</p>
      )}

      {L(cover.authorName || "Author Name", { fontSize: "13pt", fontWeight: "bold", marginBottom: "2pt" })}
      {cover.registrationNo && L(`Roll No. ${cover.registrationNo}`, { fontSize: "12pt" })}

      <div style={{ marginTop: "40pt" }}>
        {L("Submitted in partial fulfillment of the requirement for the", { fontSize: "12pt" })}
        {L(cover.degree || "M.Sc.", { fontSize: "12pt" })}
        {cover.faculty && L(`At the Faculty of ${cover.faculty},`, { fontSize: "12pt" })}
        {L(`${cover.university || "Allama Iqbal Open University, Islamabad"}.`, { fontSize: "12pt" })}
      </div>

      {cover.session && L(cover.session, { fontSize: "13pt", fontWeight: "bold", marginTop: "40pt" })}
    </div>
  );
}

// A centered signature line used by the AIOU Viva Voce acceptance page.
function AIOUSigLine({ label, name }) {
  return (
    <div style={{ marginTop: "30pt", width: "6.2cm", maxWidth: "100%" }}>
      <p style={{
        margin: 0, height: "16pt", lineHeight: "16pt", textAlign: "center",
        borderBottom: "1px solid #000", fontWeight: "bold",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{name || "\u00A0"}</p>
      {label ? <p style={{ margin: "3pt 0 0", textAlign: "center" }}>{label}</p> : null}
    </div>
  );
}

// University of the Punjab (IER/DERE) title page — built from the cover fields,
// laid out to the official specimen: TITLE / author / reg-no / DEPARTMENT /
// INSTITUTE / UNIVERSITY / LAHORE / month, year. All centered, TNR.
function PUCoverPage({ cover, tpl }) {
  const titleColor = tpl.colors.coverTitle || "#003366";
  const coverFont = getFont(tpl, "cover");
  const bodyFont = getFont(tpl);
  const C = (txt, st) => <p style={{ fontFamily: bodyFont, color: "#000", margin: 0, ...st }}>{txt}</p>;
  const inst = { fontSize: tpl.coverDeptSize || "14pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "2pt", lineHeight: 1.4 };
  return (
    <div style={{ textAlign: "center", paddingTop: "1cm", paddingBottom: "2cm" }}>
      {tpl.showLogo && cover.logo && (
        <img src={cover.logo} alt="University logo" style={{ width: "3.2cm", height: "3.2cm", objectFit: "contain", display: "block", margin: "0 auto 18pt" }} />
      )}
      {C(cover.title || "THESIS TITLE", {
        fontFamily: coverFont, fontSize: tpl.coverTitleSize || "18pt", fontWeight: "bold",
        textTransform: "uppercase", lineHeight: 1.4, maxWidth: "92%", margin: "0 auto 40pt", color: titleColor,
      })}
      {C(cover.authorName || "Author Name", { fontSize: tpl.coverAuthorSize || "14pt", fontWeight: "bold" })}
      {cover.registrationNo && C(cover.registrationNo, { fontSize: "12pt", marginTop: "2pt" })}
      <div style={{ height: "48pt" }} />
      {cover.department && C(cover.department, inst)}
      {cover.faculty && C(cover.faculty, inst)}
      {C(cover.university || "University of the Punjab", { ...inst, color: titleColor })}
      {C("Lahore", inst)}
      {cover.session && C(cover.session, { fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", marginTop: "40pt" })}
    </div>
  );
}

function CoverPage({ cover, tpl }) {
  // Route to UoG ASRB 2022 specific cover
  if (tpl.id === "uog") {
    return <UoGCoverPage cover={cover} />;
  }
  // Route to AIOU specific cover (covers all AIOU programme variants)
  if (tpl.coverLayout === "aiou_style" || tpl.variantGroup === "aiou") {
    return <AIOUCoverPage cover={cover} tpl={tpl} />;
  }
  // Route to University of the Punjab (IER) title-page format
  if (tpl.coverLayout === "pu_style") {
    return <PUCoverPage cover={cover} tpl={tpl} />;
  }

  const isRTL   = tpl.direction === "rtl";
  const isUrdu  = tpl.language === "urdu";
  const accent  = tpl.colors.coverAccent;
  const titleColor = tpl.colors.coverTitle;

  const labels = {
    by: isUrdu ? URDU_LABELS.submittedBy : "BY",
    reg: isUrdu ? URDU_LABELS.regNo : "REGISTRATION #",
    session: isUrdu ? URDU_LABELS.session : "Session",
    degree: isUrdu ? URDU_LABELS.degreeOf : "A Thesis Submitted in Partial Fulfillment of the Requirements for the Award of the Degree of",
    in: isUrdu ? "مضمون میں" : "In",
  };

  const headingFont = getFont(tpl, "heading");
  const coverFont   = getFont(tpl, "cover");
  const bodyFont    = getFont(tpl);

  return (
    <div style={{ textAlign: "center", paddingBottom: "2cm", direction: tpl.direction }}>
      <div style={{ width: "80%", height: "2pt", background: accent, margin: "0 auto 8pt" }} />
      {tpl.showLogo && (
        cover.logo ? (
          <img src={cover.logo} alt="University logo"
            style={{ width: "5.57cm", height: "4.2cm", objectFit: "contain", display: "block", margin: "0 auto 8pt" }} />
        ) : (
        <div style={{
          width: "5.57cm", height: "4.2cm",
          border: `1pt solid ${accent}`, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 8pt",
          fontFamily: coverFont, fontSize: "10pt", color: accent, fontStyle: "italic",
        }}>
          {isUrdu ? "[یونیورسٹی نشان]" : "[University Emblem]"}
        </div>
        )
      )}
      <div style={{ width: "80%", height: "1.5pt", background: accent, margin: "0 auto 10pt" }} />
      <p style={{
        fontFamily: coverFont, fontSize: tpl.coverTitleSize, fontWeight: "bold",
        textTransform: isUrdu ? "none" : "uppercase",
        lineHeight: isUrdu ? 1.8 : 1.5, color: titleColor,
        borderBottom: `2pt solid ${accent}`, paddingBottom: "6pt",
        marginBottom: "14pt", maxWidth: "90%", margin: "0 auto 14pt", textAlign: "center",
      }}>{cover.title || (isUrdu ? "مقالے کا عنوان" : "THESIS TITLE")}</p>
      <p style={{ fontFamily: bodyFont, fontSize: "12pt", marginTop: "12pt", direction: tpl.direction }}>
        {labels.degree}
      </p>
      <p style={{ fontFamily: headingFont, fontSize: tpl.coverAuthorSize, fontWeight: "bold", marginTop: "6pt", color: titleColor }}>
        {cover.degree || (isUrdu ? "ڈاکٹر آف فلاسفی" : "Doctor of Philosophy")}
      </p>
      <p style={{ fontFamily: bodyFont, fontSize: "12pt", marginTop: "2pt" }}>{labels.in}</p>
      <p style={{ fontFamily: headingFont, fontSize: tpl.coverAuthorSize, fontWeight: "bold", marginTop: "2pt", color: titleColor }}>
        {cover.subject}
      </p>
      <p style={{ fontFamily: headingFont, fontSize: tpl.coverAuthorSize, fontWeight: "bold", marginTop: "20pt", color: accent }}>
        {labels.by}
      </p>
      <p style={{
        fontFamily: coverFont, fontSize: tpl.coverAuthorSize, fontWeight: "bold",
        textTransform: isUrdu ? "none" : "uppercase", marginTop: "6pt", color: titleColor,
      }}>{cover.authorName || (isUrdu ? "نام مصنف" : "AUTHOR NAME")}</p>
      {cover.registrationNo && (
        <p style={{ fontFamily: headingFont, fontSize: tpl.coverAuthorSize, fontWeight: "bold", marginTop: "4pt" }}>
          {labels.reg} {cover.registrationNo}
        </p>
      )}
      {cover.supervisor && (
        <div style={{ marginTop: "16pt", fontFamily: bodyFont, fontSize: "12pt" }}>
          <p style={{ color: "#555" }}>{isUrdu ? URDU_LABELS.supervisor : "Supervisor"}</p>
          <p style={{ fontWeight: "bold", color: titleColor }}>{cover.supervisor}</p>
          {cover.supervisorDesignation && (
            <p style={{ color: "#555", fontSize: "11pt" }}>{cover.supervisorDesignation}</p>
          )}
        </div>
      )}
      <p style={{ fontFamily: headingFont, fontSize: tpl.coverDeptSize, fontWeight: "bold", marginTop: "20pt", color: titleColor }}>
        {cover.department}
      </p>
      <p style={{
        fontFamily: headingFont, fontSize: tpl.coverDeptSize, fontWeight: "bold",
        textTransform: isUrdu ? "none" : "uppercase", color: accent, marginTop: "6pt",
      }}>{cover.university}</p>
      {cover.session && (
        <p style={{ fontFamily: bodyFont, fontSize: "12pt", marginTop: "6pt" }}>
          {labels.session} {cover.session}
        </p>
      )}
      <div style={{ width: "80%", height: "2pt", background: accent, margin: "10pt auto 0" }} />
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function PreviewPane({ data, templateId = "hec_standard" }) {
  const tpl     = useTemplate(templateId);
  const { cover, preliminary, chapters, references } = data;
  const isRTL   = tpl.direction === "rtl";
  const isUrdu  = tpl.language === "urdu";
  const isUoG   = tpl.id === "uog";
  const isAIOU  = tpl.variantGroup === "aiou";


  const L = {
    abstract:        isUrdu ? URDU_LABELS.abstract        : "ABSTRACT",
    acknowledgement: isUrdu ? URDU_LABELS.acknowledgement : "ACKNOWLEDGEMENT",
    dedication:      isUrdu ? URDU_LABELS.dedication      : "DEDICATION",
    declaration:     isUrdu ? URDU_LABELS.declaration     : "DECLARATION",
    references:      isUrdu ? URDU_LABELS.references      : "REFERENCES",
  };

  const paddingStyle = {
    paddingTop:    tpl.margins.top     || "2.5cm",
    paddingRight:  isRTL ? (tpl.margins.right || "3.8cm") : (tpl.margins.right || "2.5cm"),
    paddingBottom: tpl.margins.bottom  || "2.5cm",
    paddingLeft:   isRTL ? (tpl.margins.left  || "2.5cm") : (tpl.margins.left  || "3.8cm"),
  };

  // Lightweight signature so the paginator re-measures only when content changes.
  const sig = useMemo(() => {
    const parts = [templateId,
      preliminary.abstract?.length, preliminary.acknowledgement?.length,
      preliminary.dedication?.length, preliminary.declaration?.length];
    chapters.forEach(ch => {
      parts.push(ch.chapterNo, (ch.title || "").length, (ch.epigraph || "").length);
      chapterBlocks(ch).forEach(b => parts.push(b.type, (b.content || "").length, (b.caption || "").length, b.imageData ? 1 : 0, b.widthPct || 100, b.rows ? b.rows.length : 0));
      (ch.sections || []).forEach(s => {
        nodeBlocks(s).forEach(b => parts.push(b.type, (b.content || "").length, (b.caption || "").length, b.imageData ? 1 : 0, b.widthPct || 100, b.rows ? b.rows.length : 0));
        (s.subsections || []).forEach(su => nodeBlocks(su).forEach(b => parts.push(b.type, (b.content || "").length, (b.caption || "").length, b.imageData ? 1 : 0, b.widthPct || 100, b.rows ? b.rows.length : 0)));
        parts.push((s.content || "").length, (s.heading || "").length);
        (s.subsections || []).forEach(su => parts.push((su.content || "").length, (su.heading || "").length));
      });
    });
    parts.push(references.length, references.join("").length);
    parts.push("toc:" + (preliminary.includeToc ? 1 : 0));
    parts.push("aiou:" + [preliminary.includeApproval, preliminary.includeForwarding, preliminary.includeListOfTables, preliminary.includeListOfFigures, preliminary.includeAbbreviations].join(","));
    parts.push((preliminary.abbreviations || []).map(a => `${a.abbr}:${a.full}`).join("|"));
    parts.push([preliminary.forwardingText, preliminary.supervisorName, preliminary.supervisorQualifications, preliminary.supervisorDesignation, preliminary.supervisorInstitution].join("~"));
    const ap = preliminary.approval || {};
    parts.push([ap.chairperson, ap.externalExaminer, ap.internalExaminer].join("~"));
    parts.push("cite:" + (data.citationStyle || ""));
    parts.push("phd:" + [preliminary.innerTitleText, preliminary.bismillahText, preliminary.vivaVoceText, preliminary.studentDeclarationText, preliminary.plagiarismText]
      .map(t => (t == null ? "d" : t.length)).join(","));
    const vvs = preliminary.vivaVoce || {};
    parts.push([vvs.department, vvs.supervisor, vvs.externalExaminer, vvs.internalExaminer, vvs.chairperson, vvs.dean, vvs.member1, vvs.member2, vvs.date].join("~"));
    return parts.join("|");
  }, [templateId, preliminary, chapters, references]);

  // ── Table of Contents support: track which page each block lands on ──
  const flowRef = useRef([]);
  const [pageOfKey, setPageOfKey] = useState({});
  let frontOffset = 1; // cover page
  if (isUoG) {
    frontOffset += (preliminary.acknowledgement ? 1 : 0) + (preliminary.dedication ? 1 : 0)
      + (preliminary.declaration ? 1 : 0) + 3 + (preliminary.abstract ? 1 : 0);
  }
  const handlePages = (pagesArr) => {
    const map = {};
    pagesArr.forEach((idxs, pi) => idxs.forEach((i) => { const b = flowRef.current[i]; if (b) map[b.key] = pi; }));
    setPageOfKey((prev) => {
      const ka = Object.keys(prev), kb = Object.keys(map);
      if (ka.length === kb.length && kb.every((k) => prev[k] === map[k])) return prev;
      return map;
    });
  };
  const tocPage = (key) => {
    const p = pageOfKey[key];
    if (p == null) return "";
    if (isAIOU) {
      const firstCh = pageOfKey["ch0-head"];
      if (firstCh == null) return "";
      return String(Math.max(1, p - firstCh + 1));
    }
    return String(p + frontOffset + 1);
  };
  const tocRow = (label, targetKey, level, opts = {}) => (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: "6px",
      fontFamily: getFont(tpl), fontSize: level === 0 && opts.bold !== false ? tpl.bodyFontSize : (tpl.refFontSize || "11pt"),
      fontWeight: (opts.bold != null ? opts.bold : level === 0) ? "bold" : "normal",
      marginTop: level === 0 ? "10pt" : "3pt",
      marginLeft: isRTL ? 0 : `${level * 20}px`, marginRight: isRTL ? `${level * 20}px` : 0,
      direction: tpl.direction,
    }}>
      <span>{label}</span>
      <span style={{ flex: 1, borderBottom: "1px dotted #9aa3af", transform: "translateY(-4px)" }} />
      <span style={{ fontWeight: "normal" }}>{tocPage(targetKey)}</span>
    </div>
  );

  // ── Build the flowable block list (everything except the cover & UoG certs) ──
  const splitParas = (t) => (t || "").split("\n").filter(l => l.trim());
  const bodyP = (txt, key, extra) => <p key={key} style={{ ...bodyStyle(tpl), ...blockQuoteStyle(txt), ...(extra || {}) }}>{txt}</p>;
  const secHead = (num, heading, key, mt = "16pt") => (
    <p key={key} style={{
      fontFamily: getFont(tpl, "heading"), fontSize: tpl.sectionSize, fontWeight: "bold",
      textAlign: isRTL ? "right" : "left", lineHeight: 1.0, marginTop: mt, marginBottom: "4pt",
      textTransform: (!isUrdu && tpl.sectionCaps) ? "uppercase" : "none",
      color: tpl.sectionColor || tpl.colors.coverAccent,
    }}>{num} {heading}</p>
  );
  const chapterHeadEl = (ch, i) => {
    const chNum = String(ch.chapterNo || i + 1).padStart(2, "0");
    if (isAIOU) {
      const numLabel = isUrdu
        ? `${URDU_LABELS.chapter} ${convertToUrduNumeral(i + 1)}`
        : `CHAPTER ${numWordEN(ch.chapterNo || i + 1)}`.toUpperCase();
      const titleLabel = isUrdu ? (ch.title || "") : String(ch.title || "").toUpperCase();
      // Chapter number first, three single spaces below it the chapter title,
      // and three single spaces below the title the first line of body text.
      const singleLine = `calc(${tpl.chapterTitleSize} * 1.0)`;
      return (
        <div style={{ direction: tpl.direction }}>
          <p style={{ fontFamily: getFont(tpl, "heading"), fontSize: tpl.chapterTitleSize, fontWeight: "bold", textAlign: "center", lineHeight: 1.0, marginTop: 0, marginBottom: `calc(${singleLine} * 3)`, color: "#000" }}>{numLabel}</p>
          <p style={{ fontFamily: getFont(tpl, "heading"), fontSize: tpl.chapterTitleSize, fontWeight: "bold", textAlign: "center", lineHeight: 1.0, marginTop: 0, marginBottom: `calc(${singleLine} * 3)`, color: "#000" }}>{titleLabel}</p>
          {ch.epigraph && <p style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, fontStyle: "italic", textAlign: "center", margin: "0 0 12pt", direction: tpl.direction }}>{ch.epigraph}</p>}
        </div>
      );
    }
    const chLabel = isUrdu ? `${URDU_LABELS.chapter} ${convertToUrduNumeral(i + 1)}` : `CHAPTER ${chNum}`;
    return (
      <div style={{ direction: tpl.direction }}>
        <p style={{ fontFamily: getFont(tpl, "heading"), fontSize: tpl.chapterNumSize, fontWeight: "bold", textDecoration: "underline", textTransform: isUrdu ? "none" : "uppercase", textAlign: tpl.chapterNumAlign || (isRTL ? "left" : "right"), marginBottom: "4pt", marginTop: 0, lineHeight: 1.0, color: tpl.colors.coverAccent }}>{chLabel}</p>
        <p style={{ fontFamily: getFont(tpl, "heading"), fontSize: tpl.chapterTitleSize, fontWeight: "bold", textTransform: isUrdu ? "none" : "uppercase", textAlign: "center", lineHeight: isUrdu ? 1.6 : 1.0, marginBottom: "8pt", marginTop: 0, color: tpl.colors.coverTitle }}>{ch.title || "(Chapter Title)"}</p>
        {ch.epigraph && <p style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, fontStyle: "italic", textAlign: "center", margin: "24pt 0", direction: tpl.direction }}>{ch.epigraph}</p>}
      </div>
    );
  };

  const flow = [];
  const pushPrelim = (kp, title, body, signature) => {
    if (!body) return;
    flow.push({ key: `${kp}-t`, breakBefore: true, keepWithNext: true, el: <PrelimTitle text={title} tpl={tpl} /> });
    splitParas(body).forEach((p, i) => flow.push({ key: `${kp}-${i}`, el: bodyP(p, `${kp}-${i}`, { fontSize: tpl.refFontSize || "11pt" }) }));
    if (signature) flow.push({ key: `${kp}-sig`, el: (
      <p style={{ fontFamily: getFont(tpl), fontSize: tpl.refFontSize || "11pt", textAlign: isRTL ? "left" : "right", marginTop: "48pt", direction: tpl.direction }}>
        ({signature})<br /><span style={{ color: "#aaa", fontSize: "9pt" }}>{isRTL ? "تاریخ: _____________" : "Date: _______________"}</span>
      </p>
    ) });
  };

  const fmP = (txt, st, key) => ({ key, el: <p style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, color: "#000", margin: 0, ...st }}>{txt}</p> });

  if (isAIOU) {
    const want = (v) => v !== false;
    const P = preliminary;

    // ── AIOU PhD template pages (Appendix E & G) — created from their text,
    //    in the same flow as every other page. Clearing a text removes it.
    //    Only for the AIOU template (the other variants are untouched). ──
    const AP = tpl.degreeLevel ? aiouPhdPageTexts(P, cover, tpl.degreeLevel)
      : { innerTitle: "", bismillah: "", vivaVoce: "", studentDeclaration: "", plagiarism: "" };
    const vvN = P.vivaVoce || {};
    const line = (txt, key, extra) => flow.push({ key, el: (
      <p key={key} style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, color: "#000", margin: 0, ...(extra || {}) }}>{txt}</p>
    ) });

    // Appendix E-II — Inner Title page
    if (AP.innerTitle.trim()) {
      flow.push({ key: "e2-head", breakBefore: true, keepWithNext: true, el: (
        <div style={{ textAlign: "center", fontFamily: getFont(tpl), color: "#000" }}>
          <p style={{ fontSize: "18pt", fontWeight: "bold", textTransform: "uppercase", lineHeight: 1.6, margin: "0 auto", maxWidth: "94%" }}>{cover.title || "THESIS TITLE"}</p>
          <p style={{ fontSize: "16pt", fontWeight: "bold", textTransform: "uppercase", margin: "40pt 0 0" }}>{cover.authorName || "NAME OF SCHOLAR"}</p>
          <p style={{ fontSize: "16pt", fontWeight: "bold", margin: "4pt 0 0" }}>Roll No. {cover.registrationNo || "__________"}</p>
          {cover.logo
            ? <img src={cover.logo} alt="University emblem" style={{ width: "4.2cm", height: "4.2cm", objectFit: "contain", display: "block", margin: "36pt auto 0" }} />
            : <p style={{ fontSize: "10pt", fontStyle: "italic", color: "#888", margin: "36pt 0 0" }}>[University Emblem]</p>}
        </div>
      ) });
      splitParas(AP.innerTitle).forEach((p, i) =>
        line(p, `e2-${i}`, { textAlign: "center", lineHeight: 2.0, ...(i === 0 ? { marginTop: "44pt" } : {}), ...(i === splitParas(AP.innerTitle).length - 1 ? { fontWeight: "bold" } : {}) }));
    }

    // Appendix E-III — "In the Name of Allah" page
    if (AP.bismillah.trim()) {
      splitParas(AP.bismillah).forEach((p, i) => flow.push({
        key: `e3-${i}`, ...(i === 0 ? { breakBefore: true } : {}),
        el: isArabicLine(p)
          ? <p key={`e3-${i}`} style={{ fontFamily: "'Traditional Arabic', 'Scheherazade New', 'Amiri', 'Times New Roman', serif", fontSize: "26pt", fontWeight: "bold", direction: "rtl", textAlign: "center", lineHeight: 1.9, color: "#000", margin: i === 0 ? "1.4cm 0 0" : "12pt 0 0" }}>{p}</p>
          : <p key={`e3-${i}`} style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, textTransform: "uppercase", textAlign: "center", color: "#000", margin: "18pt 0 0" }}>{p}</p>,
      }));
    }

    // Appendix E-IV — Acceptance by the Viva Voce Committee
    if (AP.vivaVoce.trim()) {
      flow.push({ key: "e4-head", breakBefore: true, keepWithNext: true, el: (
        <div style={{ textAlign: "center", fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, color: "#000" }}>
          <p style={{ fontWeight: "bold", fontSize: "13pt", margin: 0, lineHeight: 1.4 }}>{cover.university || "Allama Iqbal Open University, Islamabad"}</p>
          <p style={{ fontStyle: "italic", margin: "16pt 0 0" }}>Department: {vvN.department || cover.department || "______________________"}</p>
          <p style={{ margin: "10pt 0 0" }}>(Acceptance by the Viva Voce Committee)</p>
        </div>
      ) });
      line(`Title of Thesis: ${cover.title || "________________________________"}`, "e4-title", { marginTop: "22pt" });
      line(`Name of Student: ${cover.authorName || "______________________"}`, "e4-name", { marginTop: "12pt" });
      splitParas(AP.vivaVoce).forEach((p, i) => flow.push({ key: `e4-${i}`, el: bodyP(p, `e4-${i}`, { lineHeight: 2.0, ...(i === 0 ? { marginTop: "16pt" } : {}) }) }));
      flow.push({ key: "e4-sig", el: (
        <div style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, color: "#000" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.8cm", marginTop: "24pt" }}>
            <div style={{ width: "8.4cm", flexShrink: 0 }}>
              <p style={{ fontWeight: "bold", margin: 0 }}>Viva Voce Committee</p>
              <div style={{ paddingLeft: "1.1cm" }}>
                <AIOUSigLine label="External Examiner" name={vvN.externalExaminer} />
                <AIOUSigLine label="Internal Examiner" name={vvN.internalExaminer} />
                <AIOUSigLine label="Chairperson/Director" name={vvN.chairperson} />
                <AIOUSigLine label="Dean" name={vvN.dean} />
              </div>
            </div>
            <div style={{ width: "6.2cm", flexShrink: 0, textAlign: "center" }}>
              <p style={{ fontWeight: "bold", margin: 0 }}>Supervisor</p>
              <AIOUSigLine label="" name={vvN.supervisor || cover.supervisor} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.7cm", marginTop: "30pt" }}>
            <span style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>Members:</span>
            <span style={{ display: "inline-block", width: "5.2cm", height: "16pt", lineHeight: "16pt", borderBottom: "1px solid #000", textAlign: "center", overflow: "hidden", whiteSpace: "nowrap" }}>{vvN.member1 || "\u00A0"}</span>
            <span style={{ display: "inline-block", width: "5.2cm", height: "16pt", lineHeight: "16pt", borderBottom: "1px solid #000", textAlign: "center", overflow: "hidden", whiteSpace: "nowrap" }}>{vvN.member2 || "\u00A0"}</span>
          </div>
          <p style={{ margin: "22pt 0 0" }}>{vvN.date || "(Day, Month, Year)"}</p>
        </div>
      ) });
    }

    // Abstract
    if (P.abstract) {
      flow.push({ key: "abs-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text={L.abstract} tpl={tpl} /> });
      splitParas(P.abstract).forEach((p, i) => flow.push({ key: `abs-${i}`, el: bodyP(p, `abs-${i}`) }));
    }
    // Approval Sheet
    if (want(P.includeApproval)) {
      const a = P.approval || {};
      flow.push({ key: "apr-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text="APPROVAL SHEET" tpl={tpl} /> });
      flow.push({ key: "apr-b", el: bodyP(`Accepted by the ${cover.faculty || "Faculty"}, ${cover.university || "Allama Iqbal Open University, Islamabad"}, in partial fulfillment of the requirements for the ${cover.degree || "degree"}${cover.subject ? ` ${cover.subject}` : ""} degree.`, "apr-b") });
      flow.push(fmP("Viva Voce Committee:", { fontWeight: "bold", marginTop: "18pt" }, "apr-vv"));
      const sigB = (label, name, k) => flow.push({ key: k, el: (
        <div style={{ marginTop: "28pt" }}>
          <p style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, margin: 0 }}>________________________</p>
          {name && <p style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, fontWeight: "bold", margin: 0 }}>{name}</p>}
          <p style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, margin: 0 }}>{label}</p>
        </div>
      ) });
      sigB("Chairperson of Department", a.chairperson, "apr-c");
      sigB("External Examiner", a.externalExaminer, "apr-e");
      sigB("Internal Examiner", a.internalExaminer, "apr-i");
      flow.push(fmP("Date: ____________", { marginTop: "16pt" }, "apr-d"));
    }
    // Acknowledgement
    if (P.acknowledgement) {
      flow.push({ key: "ack-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text={L.acknowledgement} tpl={tpl} /> });
      splitParas(P.acknowledgement).forEach((p, i) => flow.push({ key: `ack-${i}`, el: bodyP(p, `ack-${i}`) }));
      if (cover.authorName) flow.push(fmP(cover.authorName, { textAlign: "right", marginTop: "24pt" }, "ack-sig"));
    }
    // Forwarding Certificate
    if (want(P.includeForwarding)) {
      flow.push({ key: "fwd-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text="FORWARDING CERTIFICATE" tpl={tpl} /> });
      const ftext = P.forwardingText || `This research entitled "${cover.title || "[Title]"}" is conducted under my supervision and the thesis is submitted to the ${cover.university || "Allama Iqbal Open University, Islamabad"}, in the partial fulfillment of the requirement of degree ${cover.degree || "[Degree]"}${cover.subject ? ` ${cover.subject}` : ""} with my permission.`;
      flow.push({ key: "fwd-b", el: bodyP(ftext, "fwd-b") });
      const supName = P.supervisorName || cover.supervisor, supQual = P.supervisorQualifications, supDesig = P.supervisorDesignation || cover.supervisorDesignation, supInst = P.supervisorInstitution;
      flow.push({ key: "fwd-sig", el: (
        <div style={{ textAlign: "right", marginTop: "54pt", fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, color: "#000" }}>
          <p style={{ margin: 0 }}>________________________</p>
          {supName && <p style={{ margin: 0, fontWeight: "bold" }}>{supName}</p>}
          {supQual && <p style={{ margin: 0 }}>{supQual}</p>}
          {supDesig && <p style={{ margin: 0 }}>{supDesig}</p>}
          {supInst && <p style={{ margin: 0, fontWeight: "bold" }}>{supInst}</p>}
        </div>
      ) });
    }
    // Dedication
    if (P.dedication) {
      flow.push({ key: "ded-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text={L.dedication} tpl={tpl} /> });
      splitParas(P.dedication).forEach((p, i) => flow.push({ key: `ded-${i}`, el: bodyP(p, `ded-${i}`, { textAlign: "center" }) }));
    }
    // Table of Contents (chapters + sections + references)
    if (want(P.includeToc)) {
      flow.push({ key: "toc-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text="TABLE OF CONTENTS" tpl={tpl} /> });
      chapters.forEach((ch, i) => {
        const label = `CHAPTER ${numWordEN(ch.chapterNo || i + 1)}  ${(ch.title || "").toUpperCase()}`;
        flow.push({ key: `toc-ch${i}`, el: tocRow(label, `ch${i}-head`, 0) });
        (ch.sections || []).forEach((sec, si) => {
          flow.push({ key: `toc-ch${i}-s${si}`, el: tocRow(`${sec.number} ${sec.heading}`, `ch${i}-s${si}-h`, 1) });
          (sec.subsections || []).forEach((sub, sbi) => flow.push({ key: `toc-ch${i}-s${si}-ss${sbi}`, el: tocRow(`${sub.number} ${sub.heading}`, `ch${i}-s${si}-ss${sbi}-h`, 2) }));
        });
      });
      if (references.length > 0) flow.push({ key: "toc-ref", el: tocRow("REFERENCES", "ref-t", 0) });
    }
    // List of Tables / List of Figures
    const lTables = [], lFigs = [];
    // Collect from the chapter body, from every section and from every
    // sub-section, in the order the blocks print, using the same anchor keys
    // the chapter flow gives them.
    const collect = (list, prefix) => (list || []).forEach((b, bi) => {
      if (b.type === "table" && (b.caption || b.label)) lTables.push({ b, key: `${prefix}-tbl-${b.id || bi}` });
      if (b.type === "figure" && (b.caption || b.label)) lFigs.push({ b, key: `${prefix}-fig-${b.id || bi}` });
    });
    chapters.forEach((ch, i) => {
      collect(chapterBlocks(ch), `ch${i}`);
      (ch.sections || []).forEach((sec, si) => {
        collect(nodeBlocks(sec), `ch${i}-s${si}`);
        (sec.subsections || []).forEach((sub, sbi) => collect(nodeBlocks(sub), `ch${i}-s${si}-ss${sbi}`));
      });
    });
    if (want(P.includeListOfTables) && lTables.length) {
      flow.push({ key: "lot-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text="LIST OF TABLES" tpl={tpl} /> });
      lTables.forEach((t, i) => flow.push({ key: `lot-${i}`, el: tocRow((t.b.caption || t.b.label || `Table ${i + 1}`).trim(), t.key, 0, { bold: false }) }));
    }
    if (want(P.includeListOfFigures) && lFigs.length) {
      flow.push({ key: "lof-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text="LIST OF FIGURES" tpl={tpl} /> });
      lFigs.forEach((f, i) => flow.push({ key: `lof-${i}`, el: tocRow(`${f.b.label || `Figure ${i + 1}`} ${f.b.caption || ""}`.trim(), f.key, 0, { bold: false }) }));
    }
    // Abbreviations and Acronym
    const abbr = (P.abbreviations || []).filter(a => a && (a.abbr || a.full));
    if (want(P.includeAbbreviations) && abbr.length) {
      flow.push({ key: "abbr-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text="ABBREVIATIONS AND ACRONYM" tpl={tpl} /> });
      abbr.forEach((a, i) => flow.push({ key: `abbr-${i}`, el: (
        <div style={{ display: "flex", gap: "12pt", fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, color: "#000", marginTop: "2pt" }}>
          <span style={{ minWidth: "3.5cm", fontWeight: "normal" }}>{a.abbr}</span>
          <span>{a.full}</span>
        </div>
      ) }));
    }

    // Appendix G(a) — Declaration by the Student
    if (AP.studentDeclaration.trim()) {
      flow.push({ key: "ga-head", breakBefore: true, keepWithNext: true, el: (
        <div style={{ textAlign: "center", fontFamily: getFont(tpl), color: "#000" }}>
          <p style={{ fontWeight: "bold", fontSize: "13pt", textTransform: "uppercase", lineHeight: 1.5, margin: 0 }}>
            Declaration by the Student at the Time of<br />Submission of Thesis to the Supervisor<br />for External Evaluation
          </p>
          <p style={{ fontWeight: "bold", fontSize: tpl.bodyFontSize, margin: "4pt 0 0" }}>(To be retained by the controller of examinations)</p>
          <p style={{ fontWeight: "bold", fontSize: "13pt", letterSpacing: "1px", margin: "28pt 0 0" }}>DECLARATION</p>
        </div>
      ) });
      splitParas(AP.studentDeclaration).forEach((p, i) => flow.push({ key: `ga-${i}`, el: bodyP(p, `ga-${i}`, { lineHeight: 2.0, ...(i === 0 ? { marginTop: "20pt" } : {}) }) }));
      flow.push({ key: "ga-sig", el: (
        <div style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, color: "#000" }}>
          <p style={{ textAlign: "right", margin: "44pt 0 0" }}>Signature: ____________________</p>
          <p style={{ margin: "30pt 0 0" }}>Name in Full: {cover.authorName || "____________________"}</p>
          <p style={{ margin: "6pt 0 0" }}>Date: ______________ (Day, Month, Year)</p>
        </div>
      ) });
    }

    // Appendix G(b) — Plagiarism Undertaking
    if (AP.plagiarism.trim()) {
      flow.push({ key: "gb-t", breakBefore: true, keepWithNext: true, el: (
        <p style={{ fontFamily: getFont(tpl), textAlign: "center", fontWeight: "bold", fontSize: "14pt", textDecoration: "underline", margin: 0, color: "#000" }}>Plagiarism Undertaking</p>
      ) });
      splitParas(AP.plagiarism).forEach((p, i) => flow.push({ key: `gb-${i}`, el: bodyP(p, `gb-${i}`, { lineHeight: 2.0, ...(i === 0 ? { marginTop: "20pt" } : {}) }) }));
      flow.push({ key: "gb-sig", el: (
        <div style={{ fontFamily: getFont(tpl), fontSize: tpl.bodyFontSize, color: "#000", textAlign: "right" }}>
          <p style={{ margin: "48pt 0 0" }}>Student/Author Signature: ____________________</p>
          <p style={{ margin: "16pt 0 0" }}>Name: {cover.authorName || "____________________"}</p>
        </div>
      ) });
    }
  } else {
  if (!isUoG) {
    if (preliminary.abstract) {
      flow.push({ key: "abs-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text={L.abstract} tpl={tpl} /> });
      splitParas(preliminary.abstract).forEach((p, i) => flow.push({ key: `abs-${i}`, el: bodyP(p, `abs-${i}`) }));
    }
    pushPrelim("ack", L.acknowledgement, preliminary.acknowledgement, cover.authorName);
    pushPrelim("ded", L.dedication, preliminary.dedication, cover.authorName);
    pushPrelim("dec", L.declaration, preliminary.declaration, cover.authorName);
  }

  // ── AUTOMATIC TABLE OF CONTENTS (inserted just before the chapters) ──
  if (preliminary.includeToc) {
    flow.push({ key: "toc-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text={isUrdu ? "فہرستِ مضامین" : "TABLE OF CONTENTS"} tpl={tpl} /> });
    if (!isUoG) {
      if (preliminary.abstract) flow.push({ key: "toc-abs", el: tocRow(L.abstract, "abs-t", 0) });
      if (preliminary.acknowledgement) flow.push({ key: "toc-ack", el: tocRow(L.acknowledgement, "ack-t", 0) });
      if (preliminary.dedication) flow.push({ key: "toc-ded", el: tocRow(L.dedication, "ded-t", 0) });
      if (preliminary.declaration) flow.push({ key: "toc-dec", el: tocRow(L.declaration, "dec-t", 0) });
    }
    chapters.forEach((ch, i) => {
      const chNum = String(ch.chapterNo || i + 1).padStart(2, "0");
      const label = isUrdu
        ? `${URDU_LABELS.chapter} ${convertToUrduNumeral(i + 1)} — ${ch.title || ""}`
        : `CHAPTER ${chNum} — ${ch.title || "(Untitled)"}`;
      flow.push({ key: `toc-ch${i}`, el: tocRow(label, `ch${i}-head`, 0) });
      (ch.sections || []).forEach((sec, si) => {
        flow.push({ key: `toc-ch${i}-s${si}`, el: tocRow(`${sec.number} ${sec.heading}`, `ch${i}-s${si}-h`, 1) });
        (sec.subsections || []).forEach((sub, sbi) => {
          flow.push({ key: `toc-ch${i}-s${si}-ss${sbi}`, el: tocRow(`${sub.number} ${sub.heading}`, `ch${i}-s${si}-ss${sbi}-h`, 2) });
        });
      });
    });
    if (references.length > 0) flow.push({ key: "toc-ref", el: tocRow((!isUrdu && tpl.referencesLabel) ? tpl.referencesLabel : L.references, "ref-t", 0) });
  }
  }

  chapters.forEach((ch, i) => {
    flow.push({ key: `ch${i}-head`, breakBefore: true, keepWithNext: true, el: chapterHeadEl(ch, i) });
    // `first` makes the paragraph that follows a heading start on the very next
    // line instead of leaving a gap under it.
    let first = true;
    const para = (txt, key) => { flow.push({ key, el: bodyP(txt, key, first ? { marginTop: 0 } : null) }); first = false; };
    // A run of blocks prints in exactly the order it was added.
    const runBlocks = (list, prefix) => (list || []).forEach((b, bi) => {
      if (b.type === "figure") { flow.push({ key: `${prefix}-fig-${b.id || bi}`, el: <ThesisFigure figure={b} tpl={tpl} /> }); first = false; }
      else if (b.type === "table") { flow.push({ key: `${prefix}-tbl-${b.id || bi}`, el: <ThesisTable table={b} tpl={tpl} /> }); first = false; }
      else splitParas(b.content).forEach((p, pi) => para(p, `${prefix}-p-${bi}-${pi}`));
    });

    runBlocks(chapterBlocks(ch), `ch${i}`);
    (ch.sections || []).forEach((sec, si) => {
      flow.push({ key: `ch${i}-s${si}-h`, keepWithNext: true, el: secHead(sec.number, sec.heading, `ch${i}-s${si}-h`) });
      first = true;
      splitParas(sec.content).forEach((p, pi) => para(p, `ch${i}-s${si}-p${pi}`));
      runBlocks(nodeBlocks(sec), `ch${i}-s${si}`);
      (sec.subsections || []).forEach((sub, sbi) => {
        flow.push({ key: `ch${i}-s${si}-ss${sbi}-h`, keepWithNext: true, el: secHead(sub.number, sub.heading, `ch${i}-s${si}-ss${sbi}-h`, "14pt") });
        first = true;
        splitParas(sub.content).forEach((p, pi) => para(p, `ch${i}-s${si}-ss${sbi}-p${pi}`));
        runBlocks(nodeBlocks(sub), `ch${i}-s${si}-ss${sbi}`);
      });
    });
  });

  if (references.length > 0) {
    // The chosen citation style decides the order, the numbering, the indent
    // and the spacing of the list. The heading is always REFERENCES.
    const cst = getCitationStyle(data.citationStyle);
    flow.push({ key: "ref-t", breakBefore: true, keepWithNext: true, el: <PrelimTitle text={isAIOU ? "REFERENCES" : ((!isUrdu && tpl.referencesLabel) ? tpl.referencesLabel : L.references)} tpl={tpl} /> });
    styledReferenceList(references, data.citationStyle).forEach((r, i) => flow.push({ key: `ref-${i}`, el: (
      <p style={{
        fontFamily: getFont(tpl), fontSize: tpl.refFontSize, lineHeight: cst.lineHeight,
        textAlign: isRTL ? "right" : "left", marginTop: 0, marginBottom: `${cst.spaceBetween}pt`,
        paddingLeft: isRTL ? 0 : "36pt", paddingRight: isRTL ? "36pt" : 0,
        textIndent: cst.hangingIndent ? (isRTL ? "36pt" : "-36pt") : 0, direction: tpl.direction,
      }}>{r.marker}{r.text}</p>
    ) }));
  }

  flowRef.current = flow;

  return (
    <div
      id="preview-pane"
      dir={tpl.direction}
      style={{
        fontFamily: getFont(tpl),
        fontSize: tpl.bodyFontSize,
        direction: tpl.direction,
      }}
    >
      {/* ══ COVER PAGE ══ */}
      <Page tpl={tpl} paddingStyle={paddingStyle}>
        <CoverPage cover={cover} tpl={tpl} />
      </Page>

      {/* ══ UoG ASRB 2022 EXCLUSIVE PAGES (kept as dedicated pages) ══ */}
      {isUoG && (
        <>
          {preliminary.acknowledgement && (
            <Page tpl={tpl} paddingStyle={paddingStyle}>
              <PrelimSection title="ACKNOWLEDGEMENT" body={preliminary.acknowledgement} signature={cover.authorName} tpl={tpl} />
            </Page>
          )}
          {preliminary.dedication && (
            <Page tpl={tpl} paddingStyle={paddingStyle}>
              <PrelimSection title="DEDICATION" body={preliminary.dedication} signature={cover.authorName} tpl={tpl} />
            </Page>
          )}
          {preliminary.declaration && (
            <Page tpl={tpl} paddingStyle={paddingStyle}>
              <PrelimSection title="DECLARATION" body={preliminary.declaration} signature={cover.authorName} tpl={tpl} />
            </Page>
          )}
          <Page tpl={tpl} paddingStyle={paddingStyle}><UoGCompletionCertificate cover={cover} /></Page>
          <Page tpl={tpl} paddingStyle={paddingStyle}><UoGPlagiarismCertificate cover={cover} /></Page>
          <Page tpl={tpl} paddingStyle={paddingStyle}><UoGTableOfContents chapters={chapters} references={references} /></Page>
          {preliminary.abstract && (
            <Page tpl={tpl} paddingStyle={paddingStyle}>
              <PrelimTitle text="ABSTRACT" tpl={tpl} />
              <BodyParas text={preliminary.abstract} tpl={tpl} />
            </Page>
          )}
        </>
      )}

      {/* ══ PAGINATED FLOW — prelim (non-UoG), TOC, chapters & references ══ */}
      <FlowPaginator blocks={flow} tpl={tpl} paddingStyle={paddingStyle} sig={sig} onPages={handlePages} />
    </div>
  );
}
