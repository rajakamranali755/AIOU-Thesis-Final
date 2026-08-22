import { useState, useMemo } from "react";
import { cleanPasteInto } from "../utils/textNormalize";
import { apaifyReference } from "../utils/apaName";
import {
  List, Plus, Trash2, Info, Sparkles, ScanText,
  CheckCircle2, AlertTriangle, Link2, Globe, Loader2, FileSearch,
} from "lucide-react";
import FieldBadge from "./FieldBadge";
import { useFieldDetection } from "../utils/useFieldDetection";
import { autoDetectReferences, buildBibliographyOnline, buildReference, detectSourcesFromText, gatherChapterText, referenceMatchesCitation } from "../utils/referenceExtractor";
import { chapterBlocks } from "../utils/chapterBlocks";

function RefRow({ refText, idx, onChange, onRemove, origin }) {
  const isAuto = /\[Auto-detected/i.test(refText);
  const hasLink = /https?:\/\//.test(refText || "");
  return (
    <div className="flex gap-2 items-start">
      <span className="text-slate-400 text-xs pt-2.5 w-7 text-right shrink-0 font-mono">{idx + 1}.</span>
      <div className="flex-1">
        <textarea
          rows={2}
          className={`w-full bg-white border rounded-lg px-3 py-2 text-slate-800 text-sm
                     focus:outline-none focus:ring-1 resize-none transition-colors
                     ${isAuto ? "border-amber-300 focus:border-amber-400 focus:ring-amber-300/30 bg-amber-50/40"
                              : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/30"}`}
          value={refText}
          onChange={e => onChange(e.target.value)}
          onPaste={e => cleanPasteInto(e, refText, onChange, { singleLine: true })}
          onBlur={e => { const fixed = apaifyReference(e.target.value); if (fixed !== e.target.value) onChange(fixed); }}
          placeholder="Author, A. A. (Year). Title. Publisher."
        />
        {(origin || hasLink) && (
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            {origin?.type === "intext" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                <Link2 size={10} /> in-text: {origin.label}{origin.found === false ? " · add details" : ""}
              </span>
            )}
            {origin?.type === "passage" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded" title={origin.label}>
                <FileSearch size={10} /> found from your text
              </span>
            )}
            {hasLink && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
                <Globe size={10} /> source linked
              </span>
            )}
          </div>
        )}
        {origin?.context && (
          <div className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-slate-500">
            <span className="font-bold text-slate-400 select-none" title="Source text in chapters">¶</span>
            <span className="italic">{origin.context}</span>
          </div>
        )}
      </div>
      <button onClick={onRemove}
        className="text-red-7000 hover:text-red-600 p-1.5 mt-0.5 shrink-0 hover:bg-red-500/10 rounded transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function ReferencesStep({ data, onChange, chapters = [] }) {
  const [showGuide, setShowGuide] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);
  const [scanInfo, setScanInfo] = useState(null);
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [onlineInfo, setOnlineInfo] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectProgress, setDetectProgress] = useState({ done: 0, total: 0 });
  const [detectInfo, setDetectInfo] = useState(null);
  const [phase, setPhase] = useState(null);
  const [combinedInfo, setCombinedInfo] = useState(null);
  const [originMap, setOriginMap] = useState({});

  const snippet = (s = "") => { const t = s.trim().replace(/\s+/g, " "); return t.length > 52 ? t.slice(0, 52) + "…" : t; };
  const refKey = (r) => (typeof r === "string" ? r : (r && r.text) || "").trim();

  // ── ONE button: scan in-text citations + find their online sources/links,
  //    AND detect sources of pasted/written passages — then add all, deduped.
  const handleBuildAll = async () => {
    setBuilding(true);
    setCombinedInfo(null); setScanInfo(null); setOnlineInfo(null); setDetectInfo(null);
    let current = [...data];
    const origins = { ...originMap };
    let citationsFound = 0, onlineFound = 0, placeholders = 0, sourcesMatched = 0, added = 0, serviceError = false;

    // 1) In-text citations → look each one up online for a real source + link,
    //    and label every reference with the in-text citation it belongs to.
    const { citations, suggestions } = autoDetectReferences(chapters, current);
    citationsFound = citations.length;
    if (suggestions.length) {
      setPhase("online");
      setProgress({ done: 0, total: suggestions.length });
      const results = await buildBibliographyOnline(suggestions, (done, total) => setProgress({ done, total }));
      if (results.length && results.every(r => r.error)) serviceError = true;
      const have = new Set(current.map(refKey));
      onlineFound = results.filter(r => r.found).length;
      placeholders = results.length - onlineFound;
      const newRefs = [];
      for (const r of results) {
        const refStr = r.found ? r.ref : buildReference(r.citation);
        const key = (refStr || "").trim();
        if (!key) continue;
        origins[key] = { type: "intext", label: `${r.citation.label} (${r.citation.year})`, found: !!r.found, context: r.citation.context };
        if (!have.has(key)) { newRefs.push(refStr); have.add(key); }
      }
      current = [...current, ...newRefs];
      added += newRefs.length;
    }

    // 2) Pasted/written passages → find their real source online and label it.
    const text = gatherChapterText(chapters);
    if (text && text.trim().split(/\s+/).length >= 10) {
      setPhase("sources");
      setDetectProgress({ done: 0, total: 0 });
      const { scanned, errored, sources } = await detectSourcesFromText(text, (done, total) => setDetectProgress({ done, total }));
      if (scanned > 0 && errored === scanned) serviceError = true;
      const have = new Set(current.map(refKey));
      sourcesMatched = sources.length;
      const newRefs = [];
      for (const s of sources) {
        const key = (s.ref || "").trim();
        if (!key) continue;
        if (!origins[key]) origins[key] = { type: "passage", label: snippet(s.passage), context: s.passage };
        if (!have.has(key)) { newRefs.push(s.ref); have.add(key); }
      }
      current = [...current, ...newRefs];
      added += newRefs.length;
    }

    // Attach the chapter source-text sentence to every reference that matches
    // an in-text citation, so each reference shows where it is used (¶ marker).
    for (const cit of citations) {
      if (!cit.context) continue;
      for (const ref of current) {
        if (!referenceMatchesCitation(ref, cit)) continue;
        const key = refKey(ref);
        if (!origins[key]) origins[key] = { type: "intext", label: `${cit.label} (${cit.year})`, found: true, context: cit.context };
        else if (!origins[key].context) origins[key].context = cit.context;
      }
    }

    if (added > 0) onChange(current);
    setOriginMap(origins);
    setPhase(null);
    setBuilding(false);
    setCombinedInfo({ citationsFound, onlineFound, placeholders, sourcesMatched, added, serviceError });
    setShowCoverage(true);
  };

  const add    = () => onChange([...data, ""]);
  const upd    = (idx, val) => { const c = [...data]; c[idx] = val; onChange(c); };
  const remove = (idx) => onChange(data.filter((_, i) => i !== idx));

  // Live coverage analysis: which in-text citations have a matching reference.
  const analysis = useMemo(
    () => autoDetectReferences(chapters, data),
    [chapters, data]
  );
  const hasChapters = (chapters || []).some(
    c => chapterBlocks(c).some(b => b.type === "text" && b.content && b.content.trim())
      || (c.sections || []).some(s => s.content || (s.subsections || []).some(x => x.content))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-800/30 rounded-lg flex items-center justify-center">
            <List size={16} className="text-blue-800" />
          </div>
          <div>
            <h2 className="text-base font-bold text-blue-950">References</h2>
            <p className="text-xs text-slate-9000">APA style · auto-detected from your chapters</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGuide(s => !s)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded border border-slate-200 hover:border-slate-300 transition-colors">
            <Info size={12} /> APA Guide
          </button>
          <button onClick={add}
            className="flex items-center gap-1 bg-white border border-blue-200 hover:border-blue-300 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* ── AUTOMATED REFERENCES ── */}
      <div className="mb-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-800 to-indigo-700 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={17} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-950">Automated Reference Detection</p>
            <p className="text-xs text-slate-600 mt-0.5">
              One click scans your chapters for in-text citations like <span className="font-mono bg-white/70 px-1 rounded">Esteva et&nbsp;al. (2017)</span>,
              finds each one&apos;s real source and link online, also detects the
              <span className="font-semibold"> source of copied/pasted passages</span>, and adds them all to your reference list with links.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button onClick={handleBuildAll} disabled={!hasChapters || building}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-800 hover:to-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-sm">
                {building ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {building
                  ? (phase === "sources"
                      ? `Checking passages… ${detectProgress.done}/${detectProgress.total}`
                      : `Finding sources… ${progress.done}/${progress.total}`)
                  : "Find & build all references (online)"}
              </button>
              {analysis.citations.length > 0 && (
                <button onClick={() => setShowCoverage(s => !s)}
                  className="flex items-center gap-1.5 bg-white border border-blue-200 hover:border-blue-300 text-blue-800 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                  <Link2 size={13} /> Coverage ({analysis.present.length}/{analysis.citations.length})
                </button>
              )}
            </div>

            {combinedInfo?.serviceError && (
              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-red-600">
                <Globe size={13} className="text-red-500 shrink-0 mt-0.5" />
                <span>The online source service (OpenAlex) was busy or unreachable for some lookups. Please wait a few seconds and run it again.</span>
              </div>
            )}
            {combinedInfo && !combinedInfo.serviceError && (
              <p className="text-xs font-semibold text-indigo-900 mt-2.5 flex items-start gap-1.5">
                <Globe size={13} className="text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Detected {combinedInfo.citationsFound} in-text citation{combinedInfo.citationsFound === 1 ? "" : "s"} · found {combinedInfo.onlineFound} with online source{combinedInfo.onlineFound === 1 ? "" : "s"} &amp; links
                  {combinedInfo.placeholders > 0 && ` · ${combinedInfo.placeholders} added as placeholder${combinedInfo.placeholders === 1 ? "" : "s"} to complete manually`}
                  {combinedInfo.sourcesMatched > 0 && ` · matched ${combinedInfo.sourcesMatched} pasted passage${combinedInfo.sourcesMatched === 1 ? "" : "s"} to a source`}
                  . Added {combinedInfo.added} reference{combinedInfo.added === 1 ? "" : "s"} total — please verify each before citing.
                </span>
              </p>
            )}

            {!hasChapters && (
              <p className="text-xs text-slate-500 mt-2 italic">
                Add some chapter content first — then the scanner can find your citations.
              </p>
            )}
          </div>
        </div>

        {/* Coverage breakdown */}
        {showCoverage && analysis.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200/70 space-y-1.5">
            <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-1.5">Citation Coverage</p>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {analysis.citations.map((c) => {
                const covered = analysis.present.some(p => p.key === c.key);
                return (
                  <div key={c.key}
                    className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${
                      covered ? "bg-white border-green-200" : "bg-amber-50 border-amber-200"
                    }`}>
                    {covered
                      ? <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                      : <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                    <span className="font-medium text-slate-700 truncate">{c.label} ({c.year})</span>
                    <span className={`ml-auto shrink-0 font-semibold ${covered ? "text-green-700" : "text-amber-600"}`}>
                      {covered ? "referenced" : "missing"}
                    </span>
                  </div>
                );
              })}
            </div>
            {analysis.orphans.length > 0 && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-slate-400" />
                {analysis.orphans.length} reference{analysis.orphans.length === 1 ? "" : "s"} not cited anywhere in the text.
              </p>
            )}
          </div>
        )}
      </div>

      {showGuide && (
        <div className="mb-4 p-3 bg-white border border-blue-200/50 rounded-lg text-xs text-slate-500 space-y-1.5">
          <p className="font-bold text-blue-900 mb-2">APA 7th Edition Quick Reference</p>
          <p><span className="text-slate-600">Journal:</span> Author, A. A. (Year). Title. <em>Journal, Vol</em>(Issue), pages.</p>
          <p><span className="text-slate-600">Book:</span> Author, A. A. (Year). <em>Title</em>. Publisher.</p>
          <p><span className="text-slate-600">Chapter:</span> Author, A. A. (Year). Chapter. In E. Editor (Ed.), <em>Book</em> (pp. xx–xx). Publisher.</p>
        </div>
      )}

      <div className="space-y-3">
        {data.map((ref, idx) => (
          <RefRow key={idx} refText={ref} idx={idx} onChange={v => upd(idx, v)} onRemove={() => remove(idx)} origin={originMap[refKey(ref)]} />
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <List size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No references yet — write your chapters, then hit <span className="font-semibold text-blue-700">Scan chapters</span>.</p>
        </div>
      )}
    </div>
  );
}
