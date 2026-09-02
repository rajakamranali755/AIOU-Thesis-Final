/**
 * themeTemplates.js
 *
 * HEC Pakistan Compliant Thesis Templates
 * + Urdu/Arabic RTL Format Support
 *
 * Templates based on:
 * - HEC Pakistan Thesis Writing Guide (2023)
 * - University of Punjab format
 * - Quaid-i-Azam University format
 * - NUST format
 * - COMSATS format
 * - IIU (Islamic Intl. University) format
 * - Urdu medium universities (BZU, IUB, UAF)
 */

export const TEMPLATES = {

  // ── AIOU — PhD ────────────────────────────────────────────────────────────
  aiou: {
    id: "aiou",
    degreeLevel: "phd",
    name: "AIOU — PhD",
    nameUrdu: "علامہ اقبال اوپن یونیورسٹی",
    university: "Allama Iqbal Open University, Islamabad",
    language: "english",
    direction: "ltr",
    variantGroup: "aiou",
    variantLabel: "PhD",
    isVariantDefault: true,
    description: "AIOU PhD thesis format (Appendix-E and Appendix-G of the AIOU PhD template). Hard bound in royal blue, Times New Roman 12pt double spaced, left margin 3.8cm. Front matter: Inner Title, In the Name of Allah, Acceptance by the Viva Voce Committee, Abstract (500 words), Acknowledgement, Contents, then Declaration by the Student and the Plagiarism Undertaking.",
    badge: "AIOU · PhD",
    badgeColor: "bg-sky-600",
    preview: "cover_aiou",
    fonts: { body: "Times New Roman", heading: "Times New Roman", cover: "Times New Roman" },
    margins: { left: "3.8cm", top: "3.2cm", right: "2.5cm", bottom: "2.5cm" },
    coverMargins: { left: "2.5cm", top: "2.5cm", right: "2.5cm", bottom: "2.5cm" },
    bodyFontSize: "12pt",
    bodyLineHeight: 2.0,
    paraIndent: "0.5in",
    refFontSize: "11pt",
    refLineHeight: 1.0,
    chapterNumSize: "16pt",
    chapterNumAlign: "center",
    chapterTitleSize: "16pt",
    sectionSize: "14pt",
    sectionCaps: true,
    sectionColor: "#000000",
    coverTitleSize: "16pt",
    coverAuthorSize: "14pt",
    coverDeptSize: "14pt",
    pagination: { cover: "none", prelim: "roman", body: "arabic" },
    referenceStyle: "APA7",
    colors: {
      coverTitle: "#0369a1",
      coverAccent: "#ea580c",
      ruleColor: "#0369a1",
    },
    coverLayout: "aiou_style",
    showLogo: true,
    showSpine: true,
    submissionStatement:
      "This thesis is solely the work of the author and is submitted in partial fulfillment of the requirements of the Degree of",
    abstractWordLimit: 500,
    bindingColour: "Royal Blue",
    defaults: { degree: "Doctor of Philosophy", degreeAbbr: "PhD" },
    extraFields: ["co_supervisor"],
  },

  // ── AIOU — M.Phil ─────────────────────────────────────────────────────────
  // Same rules as the PhD template (Appendix-C General Instructions) with the
  // shorter front matter of Appendix-B: no Viva Voce acceptance page and no
  // Declaration / Plagiarism Undertaking pages, maroon binding, and a
  // Dedication page carrying the "With the name of Allah" line.
  aiou_mphil: {
    id: "aiou_mphil",
    degreeLevel: "mphil",
    name: "AIOU — M.Phil",
    nameUrdu: "علامہ اقبال اوپن یونیورسٹی — ایم فل",
    university: "Allama Iqbal Open University, Islamabad",
    language: "english",
    direction: "ltr",
    variantGroup: "aiou",
    variantLabel: "M.Phil",
    description: "AIOU M.Phil thesis format (Appendix-B and Appendix-C of the AIOU M.Phil template). Hard bound in maroon, Times New Roman 12pt double spaced, left margin 3.8cm. Front matter: Inner Title, Dedication (With the name of Allah), Abstract (400 words), Acknowledgement and Contents.",
    badge: "AIOU · M.Phil",
    badgeColor: "bg-sky-600",
    preview: "cover_aiou",
    fonts: { body: "Times New Roman", heading: "Times New Roman", cover: "Times New Roman" },
    margins: { left: "3.8cm", top: "3.2cm", right: "2.5cm", bottom: "2.5cm" },
    coverMargins: { left: "2.5cm", top: "2.5cm", right: "2.5cm", bottom: "2.5cm" },
    bodyFontSize: "12pt",
    bodyLineHeight: 2.0,
    paraIndent: "0.5in",
    refFontSize: "11pt",
    refLineHeight: 1.0,
    chapterNumSize: "16pt",
    chapterNumAlign: "center",
    chapterTitleSize: "16pt",
    sectionSize: "14pt",
    sectionCaps: true,
    sectionColor: "#000000",
    coverTitleSize: "16pt",
    coverAuthorSize: "14pt",
    coverDeptSize: "14pt",
    pagination: { cover: "none", prelim: "roman", body: "arabic" },
    referenceStyle: "APA7",
    colors: {
      coverTitle: "#7f1d1d",
      coverAccent: "#b91c1c",
      ruleColor: "#7f1d1d",
    },
    coverLayout: "aiou_style",
    showLogo: true,
    showSpine: true,
    submissionStatement:
      "This thesis is solely the work of the author and is submitted in partial fulfillment of the requirements of the Degree of",
    abstractWordLimit: 400,
    bindingColour: "Maroon",
    defaults: { degree: "Master of Philosophy", degreeAbbr: "M.Phil" },
    extraFields: ["co_supervisor"],
  },

  // ── AIOU — MS (COMPUTER SCIENCES) ─────────────────────────────────────────
  // ── AIOU — URDU (ISLAMIC STUDIES) ─────────────────────────────────────────
  aiou_urdu: {
    id: "aiou_urdu",
    name: "AIOU — Urdu (Islamic Studies)",
    nameUrdu: "علامہ اقبال اوپن یونیورسٹی — اردو (علومِ اسلامیہ)",
    university: "Allama Iqbal Open University, Islamabad",
    language: "urdu",
    direction: "rtl",
    rtl: true,
    variantGroup: "aiou",
    variantLabel: "Urdu Template",
    description: "AIOU Urdu-medium thesis format (MPhil/PhD, Faculty of Arabic & Islamic Sciences). Right-to-left Nastaliq layout in Jameel Noori Nastaleeq on A4, justified body with generous line spacing, bold right-aligned headings, and numbered footnote references at the foot of the page — matching the AIOU Urdu Islamic-studies dissertation style. AIOU branding and crest.",
    badge: "AIOU · اردو",
    badgeColor: "bg-rose-700",
    preview: "cover_aiou",
    fonts: {
      body: "Jameel Noori Nastaleeq",
      heading: "Jameel Noori Nastaleeq",
      cover: "Jameel Noori Nastaleeq",
      fallback: "'Noto Nastaliq Urdu', 'Arial Unicode MS', serif",
    },
    margins: { right: "3.8cm", top: "2.5cm", left: "2.5cm", bottom: "2.5cm" },
    coverMargins: { left: "2.5cm", top: "2.5cm", right: "2.5cm", bottom: "2.5cm" },
    bodyFontSize: "14pt",
    bodyLineHeight: 2.0,
    paraIndent: "0",
    refFontSize: "12pt",
    refLineHeight: 1.5,
    chapterNumSize: "16pt",
    chapterNumAlign: "center",
    chapterTitleSize: "16pt",
    sectionSize: "14pt",
    sectionCaps: false,
    sectionColor: "#000000",
    coverTitleSize: "20pt",
    coverAuthorSize: "15pt",
    coverDeptSize: "14pt",
    pagination: { cover: "none", prelim: "roman", body: "arabic" },
    referenceStyle: "APA7_Urdu",
    colors: {
      coverTitle: "#000000",
      coverAccent: "#8B0000",
      ruleColor: "#000000",
    },
    coverLayout: "aiou_style",
    showLogo: true,
    showSpine: true,
    urduNumerals: false,
    footnoteReferencing: true,
    submissionStatement: "تحقیقی مقالہ برائے ایم فل علومِ اسلامیہ",
    defaults: {
      degree: "Master of Philosophy",
      faculty: "Arabic and Islamic Sciences",
      department: "Islamic Thought, History & Culture",
      subject: "Islamic Studies",
    },
    googleFonts: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap",
  },
};
// ── Urdu chapter headings and labels ─────────────────────────────────────────
export const URDU_LABELS = {
  chapter: "باب",
  introduction: "تعارف",
  literatureReview: "ادب کا جائزہ",
  methodology: "تحقیق کا طریقہ کار",
  results: "نتائج",
  discussion: "بحث و تمحیص",
  conclusion: "نتیجہ",
  references: "حوالہ جات",
  abstract: "خلاصہ",
  acknowledgement: "ممنونیت",
  dedication: "انتساب",
  declaration: "اعلانیہ",
  tableOfContents: "فہرست مضامین",
  listOfFigures: "فہرست اشکال",
  listOfTables: "فہرست جداول",
  appendix: "ضمیمہ",
  bibliography: "کتابیات",
  supervisor: "نگران",
  coSupervisor: "شریک نگران",
  department: "شعبہ",
  faculty: "فیکلٹی",
  submittedBy: "پیش کردہ از",
  submittedTo: "پیش کردہ بہ",
  inPartialFulfillment: "جزوی تکمیل کے لیے",
  degreeOf: "ڈگری کے لیے",
  session: "سیشن",
  regNo: "رجسٹریشن نمبر",
  page: "صفحہ",
  of: "از",
  figure: "شکل",
  table: "جدول",
  equation: "مساوات",
};

// ── Font loading helper ───────────────────────────────────────────────────────
export function getTemplateFontUrl(templateId) {
  const t = TEMPLATES[templateId];
  return t?.googleFonts || null;
}

// ── CSS variables per template ────────────────────────────────────────────────
export function getTemplateCSSVars(templateId) {
  const t = TEMPLATES[templateId] || TEMPLATES.aiou;
  return {
    "--thesis-font-body":        t.fonts.body,
    "--thesis-font-heading":     t.fonts.heading,
    "--thesis-font-cover":       t.fonts.cover,
    "--thesis-font-urdu":        t.fonts.urdu || t.fonts.body,
    "--thesis-color-title":      t.colors.coverTitle,
    "--thesis-color-accent":     t.colors.coverAccent,
    "--thesis-color-rule":       t.colors.ruleColor,
    "--thesis-body-size":        t.bodyFontSize,
    "--thesis-body-lh":          t.bodyLineHeight,
    "--thesis-ref-size":         t.refFontSize,
    "--thesis-ref-lh":           t.refLineHeight,
    "--thesis-ch-num-size":      t.chapterNumSize,
    "--thesis-ch-title-size":    t.chapterTitleSize,
    "--thesis-sec-size":         t.sectionSize,
    "--thesis-cover-title-size": t.coverTitleSize,
    "--thesis-cover-author-size":t.coverAuthorSize,
    "--thesis-cover-dept-size":  t.coverDeptSize,
    "--thesis-margin-left":      t.direction === "rtl" ? t.margins.right || "3.8cm" : t.margins.left,
    "--thesis-margin-top":       t.margins.top,
    "--thesis-margin-right":     t.direction === "rtl" ? t.margins.left || "2.5cm" : t.margins.right,
    "--thesis-margin-bottom":    t.margins.bottom,
    "--thesis-direction":        t.direction,
    "--thesis-ref-style":        t.referenceStyle,
  };
}
