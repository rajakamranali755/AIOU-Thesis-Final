/**
 * ArticleBuilder.jsx
 * Professional article writing tool — English & Urdu
 * Standalone component, does not touch thesis builder state.
 */

import { useState, useRef } from "react";
import {
  FileText, Download, Printer, Globe, Plus, Trash2,
  Eye, EyeOff, ChevronDown, ChevronUp, Type,
  AlignLeft, BookOpen, User, Tag, Calendar,
  Cpu, Quote, List, LayoutTemplate, FileDown,
  RefreshCw, Sparkles, Info, Image, UploadCloud, X, Save, Check,
} from "lucide-react";
import { addProject } from "../utils/scholarStore";
import FieldBadge from "./FieldBadge";
import { useFieldDetection } from "../utils/useFieldDetection";

// ── Article Types ─────────────────────────────────────────────────────────────
const ARTICLE_TYPES = [
  { id: "research",    label: "Research Article",      labelUrdu: "تحقیقی مضمون",     icon: "🔬" },
  { id: "review",      label: "Review Article",         labelUrdu: "جائزہ مضمون",      icon: "📋" },
  { id: "opinion",     label: "Opinion / Editorial",    labelUrdu: "رائے / اداریہ",     icon: "💬" },
  { id: "news",        label: "News Article",           labelUrdu: "خبری مضمون",       icon: "📰" },
  { id: "feature",     label: "Feature Article",        labelUrdu: "فیچر آرٹیکل",      icon: "✨" },
  { id: "academic",    label: "Academic Journal Paper", labelUrdu: "علمی جریدہ",        icon: "🎓" },
  { id: "magazine",    label: "Magazine Article",       labelUrdu: "رسالہ مضمون",      icon: "📖" },
  { id: "blog",        label: "Blog / Web Article",     labelUrdu: "بلاگ",             icon: "🌐" },
];

const EMPTY_ARTICLE = {
  language: "english",      // "english" | "urdu"
  type: "research",
  title: "",
  subtitle: "",
  authorName: "",
  authorAffiliation: "",
  authorEmail: "",
  date: new Date().toISOString().slice(0, 10),
  journal: "",
  volume: "",
  issue: "",
  pages: "",
  doi: "",
  keywords: "",
  abstract: "",
  sections: [
    { id: 1, heading: "Introduction",     content: "", subsections: [] },
    { id: 2, heading: "Main Discussion",  content: "", subsections: [] },
    { id: 3, heading: "Conclusion",       content: "", subsections: [] },
  ],
  references: [],
  figures: [],
  acknowledgements: "",
  conflictOfInterest: "",
  funding: "",
};

// ── Urdu placeholders / labels ────────────────────────────────────────────────
const URDU = {
  title:           "مضمون کا عنوان",
  subtitle:        "ذیلی عنوان (اختیاری)",
  authorName:      "مصنف کا نام",
  authorAff:       "ادارہ / یونیورسٹی",
  authorEmail:     "ای میل",
  date:            "تاریخ",
  journal:         "جریدے کا نام",
  keywords:        "کلیدی الفاظ (کاما سے الگ کریں)",
  abstract:        "خلاصہ",
  sectionHeading:  "عنوان",
  sectionContent:  "مضمون کا متن",
  references:      "حوالہ جات",
  acknowledgements:"شکریہ",
  addSection:      "سیکشن شامل کریں",
  addReference:    "حوالہ شامل کریں",
  preview:         "پیش نظارہ",
  download:        "ڈاؤن لوڈ",
};

// ── Analysed Textarea ─────────────────────────────────────────────────────────
function AnalysedTextarea({ label, value, onChange, rows = 4, placeholder = "", isUrdu = false }) {
  const { aiScore, plagScore, loading, modelGuess } = useFieldDetection(value);
  const rtlStyle = isUrdu
    ? { direction: "rtl", fontFamily: "'Noto Nastaliq Urdu', 'Arial Unicode MS', serif", fontSize: "14px" }
    : {};
  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-blue-900/80 uppercase tracking-widest mb-1.5">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        dir={isUrdu ? "rtl" : "ltr"}
        style={rtlStyle}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 focus:ring-1 focus:ring-blue-2000/30 resize-y transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <FieldBadge aiScore={aiScore} plagScore={plagScore} loading={loading} modelGuess={modelGuess} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "", isUrdu = false, type = "text" }) {
  const rtlStyle = isUrdu
    ? { direction: "rtl", fontFamily: "'Noto Nastaliq Urdu', 'Arial Unicode MS', serif", fontSize: "14px" }
    : {};
  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-blue-900/80 uppercase tracking-widest mb-1.5">
          {label}
        </label>
      )}
      <input
        type={type}
        dir={isUrdu ? "rtl" : "ltr"}
        style={rtlStyle}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 focus:ring-1 focus:ring-blue-2000/30 transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── Section Editor ────────────────────────────────────────────────────────────
function SectionEditor({ section, idx, onChange, onRemove, isUrdu }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
      <div
        className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 cursor-pointer hover:bg-slate-100/80 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-mono text-blue-8000 shrink-0">{idx + 1}.</span>
        <span className="text-sm font-bold text-slate-700 flex-1 truncate">
          {section.heading || (isUrdu ? "(عنوان)" : "(Untitled Section)")}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="text-red-7000/60 hover:text-red-600 p-1 hover:bg-red-500/10 rounded"
          >
            <Trash2 size={12} />
          </button>
          {open ? <ChevronUp size={13} className="text-slate-9000" /> : <ChevronDown size={13} className="text-slate-9000" />}
        </div>
      </div>

      {open && (
        <div className="p-4 bg-white space-y-3">
          <Field
            label={isUrdu ? URDU.sectionHeading : "Section Heading"}
            value={section.heading}
            onChange={v => onChange({ ...section, heading: v })}
            placeholder={isUrdu ? "سیکشن کا عنوان" : "e.g. Literature Review"}
            isUrdu={isUrdu}
          />
          <AnalysedTextarea
            label={isUrdu ? URDU.sectionContent : "Content"}
            value={section.content}
            onChange={v => onChange({ ...section, content: v })}
            rows={6}
            placeholder={isUrdu ? "یہاں متن لکھیں..." : "Write your section content here..."}
            isUrdu={isUrdu}
          />

          {/* Subsections — same nested structure as thesis chapters */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900/80 uppercase tracking-widest">
                {isUrdu ? "ذیلی سیکشنز" : "Subsections"} ({(section.subsections || []).length})
              </span>
              <button
                onClick={() => onChange({ ...section, subsections: [...(section.subsections || []), { id: Date.now(), heading: "", content: "" }] })}
                className="flex items-center gap-1 text-xs font-bold text-blue-800 hover:text-blue-900">
                <Plus size={11} /> {isUrdu ? "ذیلی سیکشن شامل کریں" : "Add subsection"}
              </button>
            </div>
            {(section.subsections || []).map((sub, si) => (
              <div key={sub.id} className="mb-2.5 pl-3 border-l-2 border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-blue-700 shrink-0">{idx + 1}.{si + 1}</span>
                  <input
                    value={sub.heading}
                    dir={isUrdu ? "rtl" : "ltr"}
                    onChange={e => { const subs = [...(section.subsections || [])]; subs[si] = { ...sub, heading: e.target.value }; onChange({ ...section, subsections: subs }); }}
                    placeholder={isUrdu ? "ذیلی عنوان" : "Subsection heading"}
                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    onClick={() => onChange({ ...section, subsections: (section.subsections || []).filter((_, k) => k !== si) })}
                    className="text-red-400 hover:text-red-600 p-1"><Trash2 size={11} /></button>
                </div>
                <textarea
                  rows={3}
                  value={sub.content}
                  dir={isUrdu ? "rtl" : "ltr"}
                  onChange={e => { const subs = [...(section.subsections || [])]; subs[si] = { ...sub, content: e.target.value }; onChange({ ...section, subsections: subs }); }}
                  placeholder={isUrdu ? "ذیلی سیکشن کا متن..." : "Subsection content..."}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-blue-600 resize-y"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Figure Editor ─────────────────────────────────────────────────────────────
function ArticleFigureEditor({ figure, onChange, onRemove, isUrdu }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => onChange({ ...figure, imageData: e.target.result, imageName: file.name });
    reader.readAsDataURL(file);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
      <div className="flex items-center justify-between bg-slate-100/60 px-3 py-2 border-b border-slate-200/40">
        <span className="text-xs font-bold text-blue-900/70 uppercase tracking-widest flex items-center gap-1.5">
          <Image size={11} /> {isUrdu ? "تصویر — نیچے کیپشن" : "Figure — Caption Below"}
        </span>
        <button onClick={onRemove} className="text-red-7000/60 hover:text-red-600 p-1"><Trash2 size={12} /></button>
      </div>
      <div className="p-3 space-y-3 bg-white">
        {figure.imageData ? (
          <div className="relative group rounded-lg overflow-hidden border border-slate-200">
            <img src={figure.imageData} alt="" className="w-full max-h-40 object-contain" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button onClick={() => fileRef.current?.click()} className="bg-blue-800/90 hover:bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <UploadCloud size={11} /> Replace
              </button>
              <button onClick={() => onChange({ ...figure, imageData: null, imageName: null })} className="bg-red-700/90 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <X size={11} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-6 gap-1.5 transition-all ${dragOver ? "border-blue-2000 bg-blue-600/10" : "border-slate-300 hover:border-blue-600 bg-slate-100"}`}
          >
            <UploadCloud size={20} className="text-blue-800" />
            <p className="text-xs text-slate-500 font-semibold">{isUrdu ? "تصویر اپلوڈ کریں" : "Click or drag to upload image"}</p>
            <p className="text-xs text-slate-400">JPG, PNG, GIF, WEBP</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        <div className="grid grid-cols-3 gap-2">
          <Field
            label={isUrdu ? "لیبل" : "Label"}
            value={figure.label}
            onChange={v => onChange({ ...figure, label: v })}
            placeholder="Figure 1:"
          />
          <div className="col-span-2">
            <Field
              label={isUrdu ? "کیپشن" : "Caption"}
              value={figure.caption}
              onChange={v => onChange({ ...figure, caption: v })}
              placeholder={isUrdu ? "تصویر کی وضاحت" : "Figure description"}
              isUrdu={isUrdu}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Article Preview ───────────────────────────────────────────────────────────
function ArticlePreview({ article }) {
  const isUrdu = article.language === "urdu";
  const direction = isUrdu ? "rtl" : "ltr";
  const TNR = isUrdu
    ? { fontFamily: "'Noto Nastaliq Urdu', 'Arial Unicode MS', serif" }
    : { fontFamily: "'Times New Roman', Times, serif" };
  const fontSize = isUrdu ? "14pt" : "12pt";
  const lineHeight = isUrdu ? 2.0 : 1.5;

  const articleTypeDef = ARTICLE_TYPES.find(t => t.id === article.type) || ARTICLE_TYPES[0];

  return (
    <div
      id="article-preview-pane"
      dir={direction}
      style={{
        ...TNR,
        background: "#fff",
        color: "#000",
        width: "21cm",
        minHeight: "29.7cm",
        margin: "0 auto",
        padding: "2.5cm",
        boxShadow: "0 8px 48px rgba(0,0,0,0.45)",
        fontSize,
        lineHeight,
      }}
    >
      {/* Article Type Badge */}
      <p style={{ ...TNR, fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", textAlign: isUrdu ? "right" : "left", marginBottom: "8pt" }}>
        {isUrdu ? articleTypeDef.labelUrdu : articleTypeDef.label}
      </p>

      {/* Title */}
      <p style={{
        ...TNR,
        fontSize: isUrdu ? "20pt" : "18pt",
        fontWeight: "bold",
        lineHeight: isUrdu ? 1.8 : 1.3,
        textAlign: isUrdu ? "right" : "justify",
        marginBottom: "6pt",
        borderBottom: "2pt solid #000",
        paddingBottom: "8pt",
      }}>
        {article.title || (isUrdu ? "مضمون کا عنوان" : "Article Title")}
      </p>

      {/* Subtitle */}
      {article.subtitle && (
        <p style={{ ...TNR, fontSize: isUrdu ? "15pt" : "14pt", lineHeight: isUrdu ? 1.8 : 1.3, textAlign: isUrdu ? "right" : "left", color: "#444", fontStyle: isUrdu ? "normal" : "italic", marginBottom: "10pt" }}>
          {article.subtitle}
        </p>
      )}

      {/* Author info */}
      <div style={{ display: "flex", flexDirection: isUrdu ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12pt", paddingBottom: "10pt", borderBottom: "1pt solid #ddd" }}>
        <div style={{ textAlign: isUrdu ? "right" : "left" }}>
          {article.authorName && (
            <p style={{ ...TNR, fontSize: "11pt", fontWeight: "bold", margin: 0 }}>{article.authorName}</p>
          )}
          {article.authorAffiliation && (
            <p style={{ ...TNR, fontSize: "10pt", color: "#555", margin: 0 }}>{article.authorAffiliation}</p>
          )}
          {article.authorEmail && (
            <p style={{ ...TNR, fontSize: "10pt", color: "#555", margin: 0 }}>{article.authorEmail}</p>
          )}
        </div>
        <div style={{ textAlign: isUrdu ? "left" : "right" }}>
          {article.date && (
            <p style={{ ...TNR, fontSize: "10pt", color: "#777", margin: 0 }}>{article.date}</p>
          )}
          {article.journal && (
            <p style={{ ...TNR, fontSize: "10pt", fontStyle: "italic", color: "#555", margin: 0 }}>{article.journal}</p>
          )}
          {(article.volume || article.issue) && (
            <p style={{ ...TNR, fontSize: "10pt", color: "#777", margin: 0 }}>
              {article.volume && `Vol. ${article.volume}`}{article.volume && article.issue && ", "}
              {article.issue && `Issue ${article.issue}`}
              {article.pages && `, pp. ${article.pages}`}
            </p>
          )}
          {article.doi && (
            <p style={{ ...TNR, fontSize: "9pt", color: "#888", margin: 0 }}>DOI: {article.doi}</p>
          )}
        </div>
      </div>

      {/* Keywords */}
      {article.keywords && (
        <p style={{ ...TNR, fontSize: "11pt", lineHeight: 1.4, textAlign: isUrdu ? "right" : "left", marginBottom: "12pt" }}>
          <strong>{isUrdu ? "کلیدی الفاظ:" : "Keywords:"}</strong>{" "}
          {article.keywords}
        </p>
      )}

      {/* Abstract */}
      {article.abstract && (
        <div style={{ background: "#f8f8f8", border: "1pt solid #e0e0e0", borderRadius: "4pt", padding: "10pt 14pt", marginBottom: "16pt" }}>
          <p style={{ ...TNR, fontSize: isUrdu ? "13pt" : "11pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: isUrdu ? 0 : "0.05em", marginBottom: "4pt", textAlign: isUrdu ? "right" : "left" }}>
            {isUrdu ? "خلاصہ" : "Abstract"}
          </p>
          {article.abstract.split("\n").filter(l => l.trim()).map((p, i) => (
            <p key={i} style={{ ...TNR, fontSize: isUrdu ? "13pt" : "11pt", lineHeight: isUrdu ? 1.8 : 1.4, textAlign: isUrdu ? "right" : "justify", margin: 0, marginTop: i > 0 ? "8pt" : 0 }}>{p}</p>
          ))}
        </div>
      )}

      {/* Sections */}
      {article.sections.map((sec, i) => (
        <div key={sec.id} style={{ marginBottom: "16pt" }}>
          <p style={{
            ...TNR,
            fontSize: isUrdu ? "15pt" : "13pt",
            fontWeight: "bold",
            textAlign: isUrdu ? "right" : "left",
            borderBottom: "1pt solid #e0e0e0",
            paddingBottom: "4pt",
            marginBottom: "8pt",
            lineHeight: isUrdu ? 1.8 : 1.3,
          }}>
            {!isUrdu && `${i + 1}. `}{sec.heading || (isUrdu ? "(عنوان)" : "(Untitled)")}
          </p>
          {sec.content.split("\n").filter(l => l.trim()).map((p, pi) => (
            <p key={pi} style={{ ...TNR, fontSize, lineHeight, textAlign: isUrdu ? "right" : "justify", marginTop: "10pt", marginBottom: 0 }}>{p}</p>
          ))}
          {(sec.subsections || []).map((sub, si) => (
            <div key={sub.id} style={{ marginTop: "12pt" }}>
              <p style={{ ...TNR, fontSize: isUrdu ? "13pt" : "12pt", fontWeight: "bold", textAlign: isUrdu ? "right" : "left", marginBottom: "4pt", lineHeight: isUrdu ? 1.8 : 1.3 }}>
                {!isUrdu && `${i + 1}.${si + 1} `}{sub.heading || (isUrdu ? "(ذیلی عنوان)" : "(Untitled)")}
              </p>
              {sub.content.split("\n").filter(l => l.trim()).map((p, pi) => (
                <p key={pi} style={{ ...TNR, fontSize, lineHeight, textAlign: isUrdu ? "right" : "justify", marginTop: "8pt", marginBottom: 0 }}>{p}</p>
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* Figures */}
      {article.figures.length > 0 && article.figures.map((f, fi) => (
        <div key={fi} style={{ margin: "16pt 0" }}>
          {f.imageData ? (
            <img src={f.imageData} alt={f.caption} style={{ display: "block", maxWidth: "100%", margin: "0 auto 6pt", objectFit: "contain" }} />
          ) : (
            <div style={{ border: "1pt dashed #ccc", height: "4cm", display: "flex", alignItems: "center", justifyContent: "center", ...TNR, fontSize: "11pt", color: "#aaa", fontStyle: "italic", marginBottom: "6pt" }}>
              [Figure — Upload image]
            </div>
          )}
          <p style={{ ...TNR, fontSize: "11pt", lineHeight: 1.2, textAlign: isUrdu ? "right" : "justify" }}>
            <strong>{f.label}</strong>{f.caption ? ` ${f.caption}` : ""}
          </p>
        </div>
      ))}

      {/* Acknowledgements */}
      {article.acknowledgements && (
        <div style={{ marginTop: "16pt", paddingTop: "10pt", borderTop: "1pt solid #e0e0e0" }}>
          <p style={{ ...TNR, fontSize: isUrdu ? "13pt" : "11pt", fontWeight: "bold", textAlign: isUrdu ? "right" : "left", marginBottom: "4pt" }}>
            {isUrdu ? "شکریہ" : "Acknowledgements"}
          </p>
          <p style={{ ...TNR, fontSize: isUrdu ? "13pt" : "11pt", lineHeight: isUrdu ? 1.8 : 1.4, textAlign: isUrdu ? "right" : "justify" }}>
            {article.acknowledgements}
          </p>
        </div>
      )}

      {/* Conflict of Interest */}
      {article.conflictOfInterest && (
        <p style={{ ...TNR, fontSize: "10pt", color: "#666", textAlign: isUrdu ? "right" : "left", marginTop: "8pt" }}>
          <strong>{isUrdu ? "تنازعہ:" : "Conflict of Interest:"}</strong> {article.conflictOfInterest}
        </p>
      )}

      {/* Funding */}
      {article.funding && (
        <p style={{ ...TNR, fontSize: "10pt", color: "#666", textAlign: isUrdu ? "right" : "left", marginTop: "4pt" }}>
          <strong>{isUrdu ? "مالی معاونت:" : "Funding:"}</strong> {article.funding}
        </p>
      )}

      {/* References */}
      {article.references.length > 0 && (
        <div style={{ marginTop: "16pt", paddingTop: "10pt", borderTop: "1.5pt solid #000" }}>
          <p style={{ ...TNR, fontSize: isUrdu ? "13pt" : "12pt", fontWeight: "bold", textTransform: "uppercase", textAlign: isUrdu ? "right" : "left", marginBottom: "10pt" }}>
            {isUrdu ? "حوالہ جات" : "References"}
          </p>
          {article.references.map((ref, i) => (
            <p key={i} style={{
              ...TNR,
              fontSize: isUrdu ? "12pt" : "11pt",
              lineHeight: isUrdu ? 1.8 : 1.0,
              textAlign: isUrdu ? "right" : "justify",
              marginTop: "10pt",
              marginBottom: 0,
              paddingLeft: isUrdu ? 0 : "32pt",
              paddingRight: isUrdu ? "32pt" : 0,
              textIndent: isUrdu ? "32pt" : "-32pt",
            }}>{ref}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Word Export for Article ───────────────────────────────────────────────────
function exportArticleAsWord(article) {
  const isUrdu = article.language === "urdu";
  const dir = isUrdu ? "rtl" : "ltr";
  const font = isUrdu ? "'Noto Nastaliq Urdu', Times, serif" : "'Times New Roman', Times, serif";
  const fontSize = isUrdu ? "14pt" : "12pt";
  const lh = isUrdu ? 2.0 : 1.5;
  const articleTypeDef = ARTICLE_TYPES.find(t => t.id === article.type) || ARTICLE_TYPES[0];

  const esc = (s = "") => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const css = `
    @page { size:595.3pt 841.9pt; margin:72pt; }
    body { font-family:${font}; font-size:${fontSize}; direction:${dir}; }
    p.article-type { font-size:9pt; text-transform:uppercase; letter-spacing:0.1em; color:#888; text-align:${isUrdu?"right":"left"}; }
    h1.title { font-size:${isUrdu?"20pt":"18pt"}; font-weight:bold; line-height:${isUrdu?1.8:1.3}; text-align:${isUrdu?"right":"justify"}; border-bottom:2pt solid #000; padding-bottom:8pt; margin-bottom:6pt; }
    h2.subtitle { font-size:${isUrdu?"15pt":"14pt"}; line-height:${isUrdu?1.8:1.3}; color:#444; font-style:${isUrdu?"normal":"italic"}; text-align:${isUrdu?"right":"left"}; margin-bottom:10pt; }
    p.author-name { font-size:11pt; font-weight:bold; text-align:${isUrdu?"right":"left"}; margin:0; }
    p.author-meta  { font-size:10pt; color:#555; text-align:${isUrdu?"right":"left"}; margin:0; }
    p.keywords { font-size:11pt; text-align:${isUrdu?"right":"left"}; margin-bottom:12pt; }
    div.abstract-box { background:#f8f8f8; border:1pt solid #e0e0e0; padding:10pt 14pt; margin-bottom:16pt; }
    p.abstract-title { font-size:${isUrdu?"13pt":"11pt"}; font-weight:bold; text-transform:uppercase; text-align:${isUrdu?"right":"left"}; margin-bottom:4pt; }
    p.abstract-body  { font-size:${isUrdu?"13pt":"11pt"}; line-height:${isUrdu?1.8:1.4}; text-align:${isUrdu?"right":"justify"}; margin:0; }
    h3.sec-heading { font-size:${isUrdu?"15pt":"13pt"}; font-weight:bold; text-align:${isUrdu?"right":"left"}; border-bottom:1pt solid #e0e0e0; padding-bottom:4pt; margin-bottom:8pt; line-height:${isUrdu?1.8:1.3}; }
    p.body { font-size:${fontSize}; line-height:${lh}; text-align:${isUrdu?"right":"justify"}; margin-top:10pt; margin-bottom:0; }
    p.fig-cap { font-size:11pt; line-height:1.2; text-align:${isUrdu?"right":"justify"}; margin-top:4pt; }
    p.ref { font-size:${isUrdu?"12pt":"11pt"}; line-height:${isUrdu?1.8:1.0}; text-align:${isUrdu?"right":"justify"}; margin-top:10pt; padding-${isUrdu?"right":"left"}:32pt; text-indent:${isUrdu?"32pt":"-32pt"}; }
    h4.refs-title { font-size:${isUrdu?"13pt":"12pt"}; font-weight:bold; text-transform:uppercase; text-align:${isUrdu?"right":"left"}; margin-bottom:10pt; border-top:1.5pt solid #000; padding-top:10pt; }
  `;

  let html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word"
    xmlns="http://www.w3.org/TR/REC-html40"${isUrdu?' dir="rtl"':''}>
<head><meta charset="UTF-8"/>
${isUrdu?'<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet"/>':""}
<style>${css}</style></head><body${isUrdu?' dir="rtl"':''}>`;

  html += `<p class="article-type">${esc(isUrdu ? articleTypeDef.labelUrdu : articleTypeDef.label)}</p>`;
  html += `<h1 class="title">${esc(article.title || "")}</h1>`;
  if (article.subtitle) html += `<h2 class="subtitle">${esc(article.subtitle)}</h2>`;
  if (article.authorName) html += `<p class="author-name">${esc(article.authorName)}</p>`;
  if (article.authorAffiliation) html += `<p class="author-meta">${esc(article.authorAffiliation)}</p>`;
  if (article.authorEmail) html += `<p class="author-meta">${esc(article.authorEmail)}</p>`;
  if (article.date || article.journal) html += `<p class="author-meta">${esc(article.journal || "")}${article.volume?` Vol. ${article.volume}`:""}${article.issue?` Issue ${article.issue}`:""}${article.pages?` pp. ${article.pages}`:""}${article.doi?` DOI: ${article.doi}`:""} ${esc(article.date || "")}</p>`;
  if (article.keywords) html += `<p class="keywords"><strong>${isUrdu?"کلیدی الفاظ:":"Keywords:"}</strong> ${esc(article.keywords)}</p>`;
  if (article.abstract) {
    html += `<div class="abstract-box"><p class="abstract-title">${isUrdu?"خلاصہ":"Abstract"}</p>`;
    article.abstract.split("\n").filter(l=>l.trim()).forEach(p => { html += `<p class="abstract-body">${esc(p)}</p>`; });
    html += `</div>`;
  }

  article.sections.forEach((sec, i) => {
    html += `<h3 class="sec-heading">${!isUrdu ? `${i+1}. ` : ""}${esc(sec.heading)}</h3>`;
    sec.content.split("\n").filter(l=>l.trim()).forEach(p => { html += `<p class="body">${esc(p)}</p>`; });
    (sec.subsections || []).forEach((sub, si) => {
      html += `<h4 class="sec-heading" style="font-size:12pt;">${!isUrdu ? `${i+1}.${si+1} ` : ""}${esc(sub.heading)}</h4>`;
      sub.content.split("\n").filter(l=>l.trim()).forEach(p => { html += `<p class="body">${esc(p)}</p>`; });
    });
  });

  article.figures.forEach(f => {
    if (f.imageData) html += `<img src="${f.imageData}" style="display:block;max-width:100%;margin:12pt auto;"/>`;
    else html += `<div style="border:1pt dashed #ccc;height:4cm;display:flex;align-items:center;justify-content:center;font-style:italic;font-size:11pt;color:#aaa;">[Figure — No image]</div>`;
    html += `<p class="fig-cap"><strong>${esc(f.label)}</strong>${f.caption ? ` ${esc(f.caption)}` : ""}</p>`;
  });

  if (article.acknowledgements) html += `<p class="body" style="margin-top:16pt;border-top:1pt solid #e0e0e0;padding-top:10pt;"><strong>${isUrdu?"شکریہ":"Acknowledgements:"}</strong> ${esc(article.acknowledgements)}</p>`;
  if (article.conflictOfInterest) html += `<p class="body" style="font-size:10pt;color:#666;"><strong>${isUrdu?"تنازعہ:":"Conflict of Interest:"}</strong> ${esc(article.conflictOfInterest)}</p>`;
  if (article.funding) html += `<p class="body" style="font-size:10pt;color:#666;"><strong>${isUrdu?"مالی معاونت:":"Funding:"}</strong> ${esc(article.funding)}</p>`;

  if (article.references.length > 0) {
    html += `<h4 class="refs-title">${isUrdu?"حوالہ جات":"References"}</h4>`;
    article.references.forEach(r => { html += `<p class="ref">${esc(r)}</p>`; });
  }

  html += `</body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name = (article.authorName || "Article").replace(/\s+/g, "_");
  a.download = `${name}_Article.doc`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── MAIN ArticleBuilder Component ─────────────────────────────────────────────
export default function ArticleBuilder({ user = null, initial = null }) {
  const [article, setArticle] = useState(() => (initial ? { ...EMPTY_ARTICLE, ...initial } : { ...EMPTY_ARTICLE }));
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("meta"); // meta | content | figures | extra
  const [downloading, setDownloading] = useState(false);
  const [savedToLib, setSavedToLib] = useState(false);

  const saveToLibrary = () => {
    if (!user) return;
    addProject(user.id, { title: article.title || "Untitled article", type: "article", data: article });
    window.dispatchEvent(new Event("scholarhub-library-changed"));
    setSavedToLib(true);
    setTimeout(() => setSavedToLib(false), 2000);
  };

  const isUrdu = article.language === "urdu";
  const upd = (key, val) => setArticle(a => ({ ...a, [key]: val }));

  const addSection = () => {
    const newSec = { id: Date.now(), heading: isUrdu ? "نیا سیکشن" : "New Section", content: "", subsections: [] };
    setArticle(a => ({ ...a, sections: [...a.sections, newSec] }));
  };

  const updateSection = (idx, updated) => {
    setArticle(a => { const s = [...a.sections]; s[idx] = updated; return { ...a, sections: s }; });
  };

  const removeSection = (idx) => {
    setArticle(a => ({ ...a, sections: a.sections.filter((_, i) => i !== idx) }));
  };

  const addReference = () => setArticle(a => ({ ...a, references: [...a.references, ""] }));
  const updateRef = (idx, val) => {
    setArticle(a => { const r = [...a.references]; r[idx] = val; return { ...a, references: r }; });
  };
  const removeRef = (idx) => setArticle(a => ({ ...a, references: a.references.filter((_, i) => i !== idx) }));

  const addFigure = () => {
    setArticle(a => ({ ...a, figures: [...a.figures, { id: Date.now(), label: `Figure ${a.figures.length + 1}:`, caption: "", imageData: null, imageName: null }] }));
  };
  const updateFigure = (idx, val) => {
    setArticle(a => { const f = [...a.figures]; f[idx] = val; return { ...a, figures: f }; });
  };
  const removeFigure = (idx) => setArticle(a => ({ ...a, figures: a.figures.filter((_, i) => i !== idx) }));

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => { exportArticleAsWord(article); setDownloading(false); }, 300);
  };

  const handlePrint = () => {
    const content = document.getElementById("article-preview-pane")?.outerHTML || "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      ${isUrdu ? '<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet"/>' : ""}
      <style>@page{size:A4;margin:2.5cm;}body{margin:0;}</style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  const TABS = [
    { id: "meta",    label: isUrdu ? "معلومات"    : "Article Info",  icon: FileText },
    { id: "content", label: isUrdu ? "متن"         : "Content",       icon: AlignLeft },
    { id: "figures", label: isUrdu ? "تصاویر"     : "Figures",       icon: Image },
    { id: "extra",   label: isUrdu ? "اضافی"       : "Extra Fields",  icon: Plus },
  ];

  return (
    <div className="flex-1 flex overflow-hidden min-w-0">
      {/* Form Panel */}
      <div className={`${showPreview ? "hidden xl:flex" : "flex"} flex-1 flex-col overflow-hidden min-w-0`}>
        {/* Article header toolbar */}
        <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 shrink-0">
          {/* Language toggle */}
          <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
            {[
              { id: "english", label: "English" },
              { id: "urdu",    label: "اردو" },
            ].map(lang => (
              <button key={lang.id} onClick={() => upd("language", lang.id)}
                style={lang.id === "urdu" ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${article.language === lang.id ? "bg-blue-800 text-white shadow" : "text-slate-9000 hover:text-slate-700"}`}>
                {lang.label}
              </button>
            ))}
          </div>

          {/* Article type */}
          <select
            value={article.type}
            onChange={e => upd("type", e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-2000"
          >
            {ARTICLE_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {isUrdu ? t.labelUrdu : t.label}</option>
            ))}
          </select>

          <div className="flex-1" />

          <button onClick={() => setShowPreview(s => !s)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors">
            {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPreview ? (isUrdu ? "ترمیم" : "Edit") : (isUrdu ? "پیش نظارہ" : "Preview")}
          </button>

          <button onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
            <Printer size={13} />
            <span className="hidden sm:inline">{isUrdu ? "پرنٹ" : "Print"}</span>
          </button>

          {user && (
            <button onClick={saveToLibrary}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 border border-indigo-300 hover:border-indigo-400 bg-white px-3 py-1.5 rounded-lg transition-colors">
              {savedToLib ? <Check size={13} className="text-green-600" /> : <Save size={13} />}
              <span className="hidden sm:inline">{savedToLib ? "Saved!" : "Save to Library"}</span>
            </button>
          )}

          <button onClick={handleDownload} disabled={downloading}
            className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors shadow">
            <FileDown size={13} />
            {downloading ? (isUrdu ? "..." : "Generating…") : (isUrdu ? "ڈاؤن لوڈ" : "Download .doc")}
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 bg-slate-100 border-b border-slate-200 px-4 pt-3 pb-0 shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={tab.id === "meta" && isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-t-lg border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-blue-2000 text-blue-900 bg-white"
                  : "border-transparent text-slate-9000 hover:text-slate-600 hover:bg-slate-200/50"
              }`}>
              <tab.icon size={11} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

            {/* ── META TAB ── */}
            {activeTab === "meta" && (
              <>
                <AnalysedTextarea
                  label={isUrdu ? URDU.title : "Article Title"}
                  value={article.title}
                  onChange={v => upd("title", v)}
                  rows={2}
                  placeholder={isUrdu ? URDU.title : "Full article title..."}
                  isUrdu={isUrdu}
                />
                <Field
                  label={isUrdu ? URDU.subtitle : "Subtitle (optional)"}
                  value={article.subtitle}
                  onChange={v => upd("subtitle", v)}
                  placeholder={isUrdu ? URDU.subtitle : "Optional subtitle..."}
                  isUrdu={isUrdu}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field label={isUrdu ? URDU.authorName : "Author Name"} value={article.authorName} onChange={v => upd("authorName", v)} placeholder={isUrdu ? "نام" : "Dr. Jane Smith"} isUrdu={isUrdu} />
                  <Field label={isUrdu ? URDU.authorAff : "Affiliation"} value={article.authorAffiliation} onChange={v => upd("authorAffiliation", v)} placeholder={isUrdu ? "ادارہ" : "University / Institute"} isUrdu={isUrdu} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={isUrdu ? URDU.authorEmail : "Author Email"} value={article.authorEmail} onChange={v => upd("authorEmail", v)} placeholder="email@domain.com" />
                  <Field label={isUrdu ? URDU.date : "Date"} value={article.date} onChange={v => upd("date", v)} type="date" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={isUrdu ? URDU.journal : "Journal / Publication"} value={article.journal} onChange={v => upd("journal", v)} placeholder={isUrdu ? "جریدے کا نام" : "Journal Name"} isUrdu={isUrdu} />
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Vol." value={article.volume} onChange={v => upd("volume", v)} placeholder="1" />
                    <Field label="Issue" value={article.issue} onChange={v => upd("issue", v)} placeholder="1" />
                    <Field label="Pages" value={article.pages} onChange={v => upd("pages", v)} placeholder="1-10" />
                  </div>
                </div>
                <Field label="DOI" value={article.doi} onChange={v => upd("doi", v)} placeholder="10.xxxx/xxxxxx" />
                <Field
                  label={isUrdu ? URDU.keywords : "Keywords (comma separated)"}
                  value={article.keywords}
                  onChange={v => upd("keywords", v)}
                  placeholder={isUrdu ? "الفاظ، یہاں لکھیں" : "keyword1, keyword2, keyword3"}
                  isUrdu={isUrdu}
                />
                <AnalysedTextarea
                  label={isUrdu ? URDU.abstract : "Abstract"}
                  value={article.abstract}
                  onChange={v => upd("abstract", v)}
                  rows={6}
                  placeholder={isUrdu ? "خلاصہ یہاں لکھیں..." : "Summarize your article in 150–250 words..."}
                  isUrdu={isUrdu}
                />
              </>
            )}

            {/* ── CONTENT TAB ── */}
            {activeTab === "content" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                    {isUrdu ? "سیکشنز" : "Sections"} ({article.sections.length})
                  </p>
                  <button onClick={addSection}
                    className="flex items-center gap-1 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={12} /> {isUrdu ? URDU.addSection : "Add Section"}
                  </button>
                </div>
                {article.sections.map((sec, idx) => (
                  <SectionEditor
                    key={sec.id}
                    section={sec}
                    idx={idx}
                    onChange={u => updateSection(idx, u)}
                    onRemove={() => removeSection(idx)}
                    isUrdu={isUrdu}
                  />
                ))}
                {article.sections.length === 0 && (
                  <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <AlignLeft size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{isUrdu ? "کوئی سیکشن نہیں" : "No sections yet"}</p>
                  </div>
                )}

                {/* References */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                      {isUrdu ? "حوالہ جات" : "References"} ({article.references.length})
                    </p>
                    <button onClick={addReference}
                      className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-900 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors">
                      <Plus size={12} /> {isUrdu ? URDU.addReference : "Add Reference"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {article.references.map((ref, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="text-slate-400 text-xs pt-2.5 w-6 text-right shrink-0">{idx + 1}.</span>
                        <textarea rows={2}
                          dir={isUrdu ? "rtl" : "ltr"}
                          style={isUrdu ? { fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: "13px" } : {}}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 resize-none transition-colors"
                          value={ref}
                          onChange={e => updateRef(idx, e.target.value)}
                          placeholder={isUrdu ? "حوالہ یہاں لکھیں" : "Author, A. (Year). Title. Publisher."}
                        />
                        <button onClick={() => removeRef(idx)} className="text-red-7000/60 hover:text-red-600 p-1.5 mt-0.5 hover:bg-red-500/10 rounded"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── FIGURES TAB ── */}
            {activeTab === "figures" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                    {isUrdu ? "تصاویر" : "Figures"} ({article.figures.length})
                  </p>
                  <button onClick={addFigure}
                    className="flex items-center gap-1 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={12} /> {isUrdu ? "تصویر شامل کریں" : "Add Figure"}
                  </button>
                </div>
                {article.figures.map((fig, idx) => (
                  <ArticleFigureEditor
                    key={fig.id}
                    figure={fig}
                    onChange={v => updateFigure(idx, v)}
                    onRemove={() => removeFigure(idx)}
                    isUrdu={isUrdu}
                  />
                ))}
                {article.figures.length === 0 && (
                  <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <Image size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{isUrdu ? "کوئی تصویر نہیں" : "No figures yet"}</p>
                  </div>
                )}
              </>
            )}

            {/* ── EXTRA TAB ── */}
            {activeTab === "extra" && (
              <>
                <AnalysedTextarea
                  label={isUrdu ? "شکریہ" : "Acknowledgements"}
                  value={article.acknowledgements}
                  onChange={v => upd("acknowledgements", v)}
                  rows={3}
                  placeholder={isUrdu ? "شکریہ یہاں لکھیں..." : "Thank funding bodies, colleagues..."}
                  isUrdu={isUrdu}
                />
                <Field
                  label={isUrdu ? "مالی معاونت" : "Funding"}
                  value={article.funding}
                  onChange={v => upd("funding", v)}
                  placeholder={isUrdu ? "فنڈنگ کی معلومات" : "Grant number / Funder name"}
                  isUrdu={isUrdu}
                />
                <Field
                  label={isUrdu ? "تنازعہ مفاد" : "Conflict of Interest"}
                  value={article.conflictOfInterest}
                  onChange={v => upd("conflictOfInterest", v)}
                  placeholder={isUrdu ? "کوئی تنازعہ نہیں" : "The authors declare no conflict of interest."}
                  isUrdu={isUrdu}
                />
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-9000">
                    <span className="text-blue-800 font-bold">{isUrdu ? "فارمیٹ:" : "Format:"}</span>{" "}
                    {isUrdu
                      ? "اردو مضامین میں Noto Nastaliq Urdu فونٹ، دائیں سے بائیں سمت، 14pt سائز، اور 2.0 لائن اسپیسنگ استعمال ہوتی ہے۔"
                      : "English articles use Times New Roman 12pt, 1.5 line spacing, fully justified. Exports as .doc with full formatting."}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className={`${showPreview ? "flex" : "hidden xl:flex"} flex-col bg-slate-50 border-l border-slate-200 overflow-hidden ${showPreview ? "flex-1" : "w-[50%] shrink-0"}`}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
          <Eye size={13} className="text-blue-800" />
          <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
            {isUrdu ? "پیش نظارہ" : "Live Preview"}
          </span>
          <span className="text-xs text-slate-9000 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
            A4 · {isUrdu ? "اردو Nastaliq" : "Times New Roman"}
          </span>
          {showPreview && (
            <button onClick={() => setShowPreview(false)} className="ml-auto text-xs text-slate-9000 hover:text-slate-600">
              ← {isUrdu ? "ترمیم" : "Back to Edit"}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {showPreview ? (
            <ArticlePreview article={article} />
          ) : (
            <div style={{ transform: "scale(0.48)", transformOrigin: "top left", width: "208%", pointerEvents: "none" }}>
              <ArticlePreview article={article} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
