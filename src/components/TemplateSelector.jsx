import { useState } from "react";
import { Check, Info, Globe, BookOpen, ChevronDown, ChevronUp, ExternalLink, Layers } from "lucide-react";
import { TEMPLATES } from "../data/themeTemplates";

// Templates that share a variantGroup are collapsed into a single card with a
// dropdown (e.g. all the AIOU programme formats sit under one "AIOU" card).
// Build a map: groupId -> [variant templates, default first].
const VARIANT_GROUPS = {};
for (const t of Object.values(TEMPLATES)) {
  if (!t.variantGroup) continue;
  (VARIANT_GROUPS[t.variantGroup] ||= []).push(t);
}
for (const list of Object.values(VARIANT_GROUPS)) {
  list.sort((a, b) => (b.isVariantDefault ? 1 : 0) - (a.isVariantDefault ? 1 : 0));
}
// The single representative id shown in the grid for each group.
const GROUP_REPRESENTATIVE = {};
for (const [groupId, list] of Object.entries(VARIANT_GROUPS)) {
  GROUP_REPRESENTATIVE[groupId] = (list.find(t => t.isVariantDefault) || list[0]).id;
}
// A variant is hidden from the grid unless it is its group's representative.
const isHiddenVariant = (t) =>
  t.variantGroup && GROUP_REPRESENTATIVE[t.variantGroup] !== t.id;

// Preferred display order — keeps the default (HEC) first and surfaces AIOU
// and the official UoG format within the first six shown. Any template not
// listed here is appended automatically.
const ORDER = [
  "hec_standard", "aiou", "uog", "punjab", "nust", "qau",
  "comsats", "iiu", "urdu_medium", "uog_first_sample",
  "apa_social", "mla_humanities", "ieee_cs", "engineering",
];
const TEMPLATE_LIST = [
  ...ORDER.map(id => TEMPLATES[id]).filter(Boolean),
  ...Object.values(TEMPLATES).filter(t => !ORDER.includes(t.id)),
].filter(t => !isHiddenVariant(t));

function MiniCoverPreview({ template }) {
  const isRTL = template.direction === "rtl";
  const accent = template.colors.coverAccent;
  const isUrdu = template.language === "urdu";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Arial Unicode MS', serif" : "'Times New Roman', serif",
        background: "#fff",
        width: "100%",
        aspectRatio: "0.707",
        padding: "8%",
        fontSize: "5px",
        color: "#000",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: isRTL ? "flex-end" : "center",
        textAlign: isRTL ? "right" : "center",
        overflow: "hidden",
      }}
    >
      {/* Rule top */}
      <div style={{ width: "80%", height: "0.8px", background: accent, marginBottom: "6px" }} />

      {/* Logo placeholder */}
      <div style={{
        width: "18px", height: "13px",
        border: `0.5px solid ${accent}`,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "4px", color: accent, fontSize: "4px",
      }}>🎓</div>

      <div style={{ width: "80%", height: "0.5px", background: accent, marginBottom: "5px" }} />

      {/* Title */}
      <div style={{
        fontWeight: "bold", fontSize: "6px",
        color: template.colors.coverTitle,
        lineHeight: 1.3, marginBottom: "5px",
        maxWidth: "85%",
        textTransform: "uppercase",
        textAlign: isRTL ? "right" : "center",
      }}>
        {isUrdu ? "عنوان مقالہ" : "THESIS TITLE"}
      </div>

      <div style={{ fontSize: "4.5px", marginBottom: "3px", color: "#555" }}>
        {isUrdu ? "پیش کردہ از" : "BY"}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "5.5px", marginBottom: "5px", color: template.colors.coverTitle }}>
        {isUrdu ? "نام مصنف" : "AUTHOR NAME"}
      </div>

      <div style={{ marginTop: "auto" }}>
        <div style={{ fontWeight: "bold", fontSize: "5px", color: template.colors.coverAccent }}>
          {isUrdu ? template.university : template.university.split(",")[0]}
        </div>
        {!isUrdu && (
          <div style={{ fontSize: "4px", color: "#555", marginTop: "2px" }}>
            {new Date().getFullYear()}
          </div>
        )}
      </div>

      {/* Bottom rule */}
      <div style={{ width: "80%", height: "0.8px", background: accent, marginTop: "5px" }} />

      {/* Template badge overlay */}
      <div style={{
        position: "absolute", top: "4px", right: "4px",
        background: accent, color: "#fff",
        fontSize: "3.5px", padding: "1px 3px", borderRadius: "2px",
        fontFamily: "system-ui, sans-serif",
      }}>
        {template.badge}
      </div>
    </div>
  );
}

function TemplateCard({ template, selected, onSelect, selectedId, variants }) {
  const [showInfo, setShowInfo] = useState(false);
  const isRTL = template.direction === "rtl";
  const isBilingual = template.language === "bilingual";

  // When this card represents a variant group (e.g. AIOU), expose the variants
  // through a dropdown. The card counts as selected if ANY of its variants is
  // the active template.
  const hasVariants = Array.isArray(variants) && variants.length > 1;
  const groupSelectedId =
    hasVariants && variants.some(v => v.id === selectedId)
      ? selectedId
      : template.id;

  return (
    <div
      className={`relative rounded-xl border-2 overflow-hidden transition-all cursor-pointer group ${
        selected
          ? "border-blue-2000 ring-2 ring-blue-2000/30 shadow-lg shadow-amber-900/20"
          : "border-slate-200 hover:border-slate-1000"
      }`}
      onClick={() => onSelect(hasVariants ? groupSelectedId : template.id)}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow">
          <Check size={11} className="text-white" strokeWidth={3} />
        </div>
      )}

      {/* Info */}
      <div className="bg-white relative">
        {/* Accent bar from the template's own cover colours */}
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${template.colors.coverTitle}, ${template.colors.coverAccent})` }} />

        <div className="p-2.5">
          <div className="flex items-start justify-between gap-1 mb-1">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-extrabold leading-tight ${isRTL ? "text-right" : ""}`}
                 style={isRTL
                   ? { fontFamily: "'Noto Nastaliq Urdu', serif", color: template.colors.coverTitle }
                   : {
                       backgroundImage: `linear-gradient(90deg, ${template.colors.coverTitle}, ${template.colors.coverAccent})`,
                       WebkitBackgroundClip: "text", backgroundClip: "text",
                       WebkitTextFillColor: "transparent",
                     }}>
                {template.name}
              </p>
              {template.nameUrdu && template.language !== "urdu" && (
                <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Noto Nastaliq Urdu', serif", direction: "rtl", textAlign: "right" }}>
                  {template.nameUrdu}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              {isRTL && (
                <span className="text-xs bg-rose-100 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded font-bold">RTL</span>
              )}
              {isBilingual && (
                <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-bold">2-lang</span>
              )}
            </div>
          </div>

          {/* Discipline */}
          {template.discipline && (
            <p className="text-xs font-semibold mb-1.5 truncate" style={{ color: template.colors.coverAccent }}>
              {template.discipline}
            </p>
          )}

          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded font-bold text-white shadow-sm ${template.badgeColor}`}>
              {template.badge}
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded border"
                  style={{ color: template.colors.coverTitle, borderColor: template.colors.coverTitle + "55", background: template.colors.coverTitle + "0f" }}>
              {template.referenceStyle}
            </span>
          </div>

          {/* Programme / format dropdown for grouped templates (e.g. AIOU) */}
          {hasVariants && (
            <div className="mb-2" onClick={e => e.stopPropagation()}>
              <label className="flex items-center gap-1 text-xs font-semibold mb-1"
                     style={{ color: template.colors.coverTitle }}>
                <Layers size={11} /> Choose format
              </label>
              <div className="relative">
                <select
                  value={groupSelectedId}
                  onChange={e => onSelect(e.target.value)}
                  className="w-full appearance-none text-xs font-semibold rounded-lg border bg-white py-1.5 pl-2 pr-7 cursor-pointer focus:outline-none focus:ring-2 transition-shadow"
                  style={{
                    color: template.colors.coverTitle,
                    borderColor: template.colors.coverTitle + "55",
                  }}
                >
                  {variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.variantLabel || v.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: template.colors.coverAccent }}
                />
              </div>
              {variants.some(v => v.id === selectedId) && (
                <p className="text-xs text-slate-500 mt-1">
                  Selected: {(variants.find(v => v.id === selectedId)?.variantLabel) || template.name}
                </p>
              )}
            </div>
          )}

          <button
            onClick={e => { e.stopPropagation(); setShowInfo(s => !s); }}
            className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
            style={{ color: template.colors.coverAccent }}
          >
            <Info size={11} />
            {showInfo ? "Hide details" : "Details"}
            {showInfo ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          {showInfo && (
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed pt-1.5"
               style={{ borderTop: `1px solid ${template.colors.coverTitle}22` }}>
              {template.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TemplateSelector({ selectedId, onSelect }) {
  const [filter, setFilter] = useState("all"); // all | english | urdu | bilingual
  const [showAll, setShowAll] = useState(false);
  const [started, setStarted] = useState(false);

  const filtered = TEMPLATE_LIST.filter(t => {
    if (filter === "all") return true;
    if (filter === "urdu") return t.language === "urdu";
    if (filter === "bilingual") return t.language === "bilingual";
    return t.language === "english";
  });

  const INITIAL_COUNT = 6;
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hiddenCount = filtered.length - visible.length;

  const current = TEMPLATES[selectedId] || TEMPLATES.hec_standard;

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-blue-800/30 rounded-lg flex items-center justify-center">
          <BookOpen size={16} className="text-blue-800" />
        </div>
        <div>
          <h2 className="text-base font-bold text-blue-950">Thesis Template</h2>
          <p className="text-xs text-slate-9000">HEC Pakistan formats · Urdu RTL support</p>
        </div>
      </div>

      {/* Currently selected */}
      <div className={`mb-4 p-3 rounded-xl border border-blue-600/50 bg-blue-100/10 flex items-center gap-3`}>
        <Check size={14} className="text-blue-800 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-blue-900">
            Active: {current.name}
          </p>
          <p className="text-xs text-slate-9000 truncate">{current.university} · {current.referenceStyle}</p>
        </div>
        {current.direction === "rtl" && (
          <span className="text-xs bg-rose-700/30 text-rose-600 border border-rose-700/40 px-1.5 py-0.5 rounded font-bold shrink-0">
            RTL اردو
          </span>
        )}
      </div>

      {/* Urdu note */}
      {current.direction === "rtl" && (
        <div className="mb-4 p-3 bg-rose-900/20 border border-rose-800/50 rounded-xl">
          <div className="flex gap-2">
            <Globe size={14} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 space-y-1">
              <p className="font-bold">اردو / RTL Mode Active</p>
              <p className="text-rose-600">Document direction set to right-to-left. Noto Nastaliq Urdu font loaded. Binding margin is on the right side. Chapter headings use Urdu labels (باب، تعارف، etc.).</p>
              <p className="text-rose-7000">Note: For production Urdu documents, we recommend exporting to Word and applying proper Nastaliq formatting in MS Word with Urdu spell-check enabled.</p>
            </div>
          </div>
        </div>
      )}

      {/* Start button — templates are revealed only after clicking */}
      {!started && (
        <button onClick={() => setStarted(true)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-900 hover:to-indigo-800 text-white text-sm font-bold py-3.5 rounded-xl transition-colors shadow">
          <BookOpen size={17} /> Browse Templates ({TEMPLATE_LIST.length} formats)
        </button>
      )}

      {started && (<>
      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-4">
        {[
          { id: "all",       label: "All"        },
          { id: "english",   label: "English"    },
          { id: "urdu",      label: "اردو RTL"   },
          { id: "bilingual", label: "Bilingual"  },
        ].map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setShowAll(false); }}
            className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${
              filter === f.id ? "bg-slate-100 text-slate-800" : "text-slate-9000 hover:text-slate-600"
            }`}
            style={f.id === "urdu" ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-3">
        {visible.map(template => {
          const variants = template.variantGroup ? VARIANT_GROUPS[template.variantGroup] : null;
          const selected = variants
            ? variants.some(v => v.id === selectedId)
            : selectedId === template.id;
          return (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selected}
              selectedId={selectedId}
              variants={variants}
              onSelect={onSelect}
            />
          );
        })}
      </div>

      {/* View more / less */}
      {filtered.length > INITIAL_COUNT && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-900 hover:to-indigo-800 text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-sm">
          {showAll
            ? <>Show fewer templates <ChevronUp size={16} /></>
            : <>View more templates ({hiddenCount}) <ChevronDown size={16} /></>}
        </button>
      )}
      </>)}

      {/* HEC compliance note */}
      <div className="mt-5 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-9000 space-y-1">
        <p className="font-bold text-slate-500">HEC Pakistan Format Standards</p>
        <p>All English templates comply with HEC's 2023 Thesis Writing Guide: left margin 1.5″ (3.8cm), other margins 1″ (2.5cm), Times New Roman 12pt, 1.5 line spacing.</p>
        <p>Urdu template uses right margin 1.5″ (RTL binding), Noto Nastaliq Urdu 14pt, 2.0 line spacing per Urdu typography standards.</p>
      </div>
    </div>
  );
}
