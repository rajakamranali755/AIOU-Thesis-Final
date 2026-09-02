import { useState, useMemo } from "react";
import { cleanPasteInto } from "../utils/textNormalize";
import { List, Plus, Trash2, Info, ChevronUp, ChevronDown, ChevronRight, Save } from "lucide-react";
import { CITATION_STYLES, DEFAULT_CITATION_STYLE, getCitationStyle, styledReferenceList } from "../utils/citationStyles";
import { SOURCE_TYPES, fieldsFor, formatFullCitation, formatInTextCitation } from "../utils/citationBuilder";

const EMPTY_CONTRIBUTOR = { role: "Author", first: "", mid: "", last: "", suffix: "" };

function FormField({ label, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-slate-600 mb-1">
        {label}{required && <span className="text-slate-500"> *</span>}
      </label>
      <input
        className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 text-sm
                   focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ""}
      />
    </div>
  );
}

/**
 * CitationForm — fill in the source's details for the selected style and press
 * Save; the finished reference is added to the list below.
 */
function CitationForm({ styleId, onStyleChange, onSave }) {
  const [source, setSource] = useState("book");
  const [tab, setTab] = useState("full");
  const [contributors, setContributors] = useState([{ ...EMPTY_CONTRIBUTOR }]);
  const [values, setValues] = useState({});
  const [page, setPage] = useState("");
  const [error, setError] = useState("");

  const fields = fieldsFor(styleId, source);
  const setVal = (id, v) => setValues(o => ({ ...o, [id]: v }));
  const setContrib = (i, key, v) => setContributors(cs => cs.map((c, ci) => (ci === i ? { ...c, [key]: v } : c)));

  const reset = () => { setContributors([{ ...EMPTY_CONTRIBUTOR }]); setValues({}); setPage(""); setError(""); };

  const save = () => {
    const missing = fields.filter(f => f.req && !String(values[f.id] || "").trim()).map(f => f.label);
    const noName = !contributors.some(c => (c.last || "").trim());
    if (noName) missing.unshift("Last Name");
    if (missing.length) { setError(`Please fill in: ${missing.join(", ")}`); return; }
    onSave(formatFullCitation(styleId, source, values, contributors));
    reset();
  };

  const preview = formatFullCitation(styleId, source, values, contributors);
  const inText = formatInTextCitation(styleId, values, contributors, page);

  return (
    <div className="mb-5 rounded-xl border border-slate-300 bg-white p-5">
      {/* Citation Style */}
      <p className="text-sm text-slate-700 mb-2">Citation Style</p>
      <div className="flex flex-wrap items-center gap-6 mb-5">
        {Object.values(CITATION_STYLES).map((st) => (
          <label key={st.id} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="citation-style" checked={st.id === styleId}
              onChange={() => onStyleChange(st.id)}
              className="w-4 h-4 accent-blue-800" />
            <span className="text-sm text-slate-800">{st.label.replace(/\s\d+(th)?$/, "")}</span>
          </label>
        ))}
      </div>

      {/* Source */}
      <label className="block text-sm text-slate-700 mb-1">Source</label>
      <select
        className="w-full bg-white border border-slate-300 rounded px-3 py-2.5 text-slate-800 text-sm mb-5
                   focus:outline-none focus:border-blue-600"
        value={source} onChange={e => { setSource(e.target.value); setValues({}); }}>
        {SOURCE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>

      {/* Contributors */}
      <div className="space-y-3 mb-2">
        {contributors.map((c, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 sm:col-span-2">
              <label className="block text-xs text-slate-600 mb-1">Contributor</label>
              <select className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-2 text-slate-600 text-sm"
                value={c.role} onChange={e => setContrib(i, "role", e.target.value)}>
                {["Author", "Editor", "Translator"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-span-12 sm:col-span-3">
              <FormField label="First Name" required value={c.first} onChange={v => setContrib(i, "first", v)} />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <FormField label="Middle Initial" value={c.mid} onChange={v => setContrib(i, "mid", v)} />
            </div>
            <div className="col-span-12 sm:col-span-3">
              <FormField label="Last Name" required value={c.last} onChange={v => setContrib(i, "last", v)} />
            </div>
            <div className="col-span-5 sm:col-span-1">
              <FormField label="Suffix" value={c.suffix} onChange={v => setContrib(i, "suffix", v)} />
            </div>
            <div className="col-span-1 flex justify-end pb-1">
              {contributors.length > 1 && (
                <button onClick={() => setContributors(cs => cs.filter((_, ci) => ci !== i))}
                  className="text-slate-300 hover:text-red-600 p-1 rounded" title="Remove contributor">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setContributors(cs => [...cs, { ...EMPTY_CONTRIBUTOR }])}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-800 mb-5 transition-colors">
        Add Contributor <ChevronRight size={14} />
      </button>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5">
        {[["full", "Full Citation"], ["intext", "In-text Citation"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 pb-2.5 text-sm font-bold transition-colors ${
              tab === id ? "text-teal-800 border-b-2 border-teal-800" : "text-slate-500 hover:text-slate-700"
            }`}>{label}</button>
        ))}
      </div>

      {tab === "full" ? (
        <div className="space-y-4">
          {fields.map(f => (
            <FormField key={f.id} label={f.label} required={f.req} placeholder={f.ph}
              value={values[f.id]} onChange={v => setVal(f.id, v)} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <FormField label="Page(s)" placeholder="1-2, A1, ii-xi" value={page} onChange={setPage} />
          <div>
            <p className="text-xs text-slate-600 mb-1">In-text citation</p>
            <p className="bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-sm text-slate-800 font-mono">{inText}</p>
          </div>
        </div>
      )}

      {/* Preview + Save */}
      <div className="mt-5 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-600 mb-1">Preview</p>
        <p className="text-sm text-slate-700 mb-3" style={{ paddingLeft: "28px", textIndent: "-28px" }}>{preview}</p>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <div className="flex gap-2">
          <button onClick={save}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-900 hover:to-indigo-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Save size={13} /> Save
          </button>
          <button onClick={reset}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function RefRow({ refText, idx, onChange, onRemove, onMove, isFirst, isLast, placeholder }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-slate-400 text-xs pt-2.5 w-7 text-right shrink-0 font-mono">{idx + 1}.</span>
      <div className="flex-1">
        <textarea
          rows={2}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm
                     focus:outline-none focus:ring-1 focus:border-blue-600 focus:ring-blue-600/30 resize-none transition-colors"
          value={refText}
          onChange={e => onChange(e.target.value)}
          onPaste={e => cleanPasteInto(e, refText, onChange, { singleLine: true })}
          placeholder={placeholder}
        />
      </div>
      <div className="flex flex-col gap-0.5 shrink-0 pt-1">
        <button onClick={() => onMove(-1)} disabled={isFirst} title="Move up"
          className="text-slate-400 hover:text-blue-700 disabled:opacity-25 p-0.5 rounded transition-colors">
          <ChevronUp size={13} />
        </button>
        <button onClick={() => onMove(1)} disabled={isLast} title="Move down"
          className="text-slate-400 hover:text-blue-700 disabled:opacity-25 p-0.5 rounded transition-colors">
          <ChevronDown size={13} />
        </button>
      </div>
      <button onClick={onRemove} title="Remove"
        className="text-red-7000 hover:text-red-600 p-1.5 mt-0.5 shrink-0 hover:bg-red-500/10 rounded transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function ReferencesStep({ data, onChange, citationStyle, onStyleChange = () => {} }) {
  const [showGuide, setShowGuide] = useState(false);
  const styleId = citationStyle || DEFAULT_CITATION_STYLE;
  const st = getCitationStyle(styleId);

  const upd = (idx, val) => onChange(data.map((r, i) => (i === idx ? val : r)));
  const add = () => onChange([...data, ""]);
  const remove = (idx) => onChange(data.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= data.length) return;
    const arr = [...data];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    onChange(arr);
  };

  // How the list will actually print once the chosen style's rules are applied.
  const preview = useMemo(() => styledReferenceList(data, styleId), [data, styleId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-800/30 rounded-lg flex items-center justify-center">
            <List size={16} className="text-blue-800" />
          </div>
          <div>
            <h2 className="text-base font-bold text-blue-950">References</h2>
            <p className="text-xs text-slate-9000">Citation index — fill the form, press Save, and the reference is added below</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGuide(s => !s)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded border border-slate-200 hover:border-slate-300 transition-colors">
            <Info size={12} /> {st.label} Guide
          </button>
          <button onClick={add} title="Add a blank entry to type in yourself"
            className="flex items-center gap-1 bg-white border border-blue-200 hover:border-blue-300 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={13} /> Add manually
          </button>
        </div>
      </div>

      <CitationForm styleId={styleId} onStyleChange={onStyleChange} onSave={(ref) => onChange([...data, ref])} />

      {showGuide && (
        <div className="mb-4 p-3 bg-white border border-blue-200/50 rounded-lg text-xs text-slate-500 space-y-1.5">
          <p className="font-bold text-blue-900 mb-2">{st.label} — entry format</p>
          <p className="font-mono text-slate-600">{st.example}</p>
          <p>{st.note}</p>
        </div>
      )}

      <div className="space-y-3">
        {data.map((ref, idx) => (
          <RefRow key={idx} refText={ref} idx={idx}
            onChange={v => upd(idx, v)} onRemove={() => remove(idx)} onMove={(d) => move(idx, d)}
            isFirst={idx === 0} isLast={idx === data.length - 1} placeholder={st.example} />
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <List size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No references yet — fill in the form above and press <span className="font-semibold text-blue-700">Save</span>.</p>
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-2">
            REFERENCES — as they will print in {st.label}
          </p>
          <div className="space-y-1.5">
            {preview.map((r, i) => (
              <p key={i} className="text-xs text-slate-600" style={{ paddingLeft: "28px", textIndent: "-28px" }}>
                {r.marker}{r.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
