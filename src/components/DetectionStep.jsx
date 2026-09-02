import { useState, useCallback } from "react";
import {
  ShieldCheck, Brain, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Loader2, Search,
  FileWarning, Highlighter, BarChart3, Info,
  RefreshCw, Eye, Zap, Cpu, TrendingUp,
} from "lucide-react";
import { detectAI, detectPlagiarism, extractTextBlocks, extractAllText } from "../utils/detectionEngine";

// ── Colour scale
function scoreColor(score) {
  if (score >= 70) return { bg:"bg-red-500/20",    border:"border-red-500/50",    text:"text-red-600",    bar:"bg-red-500"    };
  if (score >= 48) return { bg:"bg-orange-500/20", border:"border-orange-500/50", text:"text-orange-600", bar:"bg-orange-500" };
  if (score >= 25) return { bg:"bg-yellow-500/15", border:"border-yellow-600/50", text:"text-yellow-600", bar:"bg-yellow-400" };
  return              { bg:"bg-green-500/15",   border:"border-green-600/50",  text:"text-green-600",  bar:"bg-green-500"  };
}

// ── Animated score ring
function ScoreRing({ score, size = 96 }) {
  const c = scoreColor(score);
  const r = 36, circ = 2 * Math.PI * r;
  const barColor = score >= 70 ? "#ef4444" : score >= 48 ? "#f97316" : score >= 25 ? "#eab308" : "#22c55e";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 96 96" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="#27272a" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={barColor} strokeWidth="8"
          strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray 0.9s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className={`text-2xl font-black ${c.text}`}>{score}</div>
        <div className="text-xs text-slate-9000 font-bold">/ 100</div>
      </div>
    </div>
  );
}

// ── Signal bar
function SignalBar({ signal }) {
  const c = scoreColor(signal.score);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-xs font-bold text-slate-700 shrink-0">{signal.name}</span>
          <span className={`text-xs px-1.5 py-0 rounded font-bold shrink-0 ${
            signal.indicator === "AI" ? "bg-red-500/20 text-red-600" :
            signal.indicator === "Mixed" ? "bg-yellow-500/20 text-yellow-600" :
            "bg-green-500/20 text-green-600"
          }`}>{signal.indicator}</span>
        </div>
        <span className={`text-xs font-black px-2 py-0.5 rounded ${c.bg} ${c.text} ${c.border} border shrink-0 ml-2`}>
          {signal.score}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-1">{signal.desc}</p>
      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
        <div className={`h-full ${c.bar} rounded-full transition-all duration-700`}
          style={{ width: `${signal.score}%` }} />
      </div>
      {signal.examples?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {signal.examples.map((e, i) => (
            <span key={i} className="text-xs bg-orange-900/30 text-orange-700 border border-orange-800/40 px-1.5 py-0.5 rounded font-mono">
              "{e}"
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Model fingerprint card
function ModelCard({ modelGuess }) {
  if (!modelGuess) return null;
  const [open, setOpen] = useState(false);
  const maxScore = Math.max(...modelGuess.all.map(m => m.score), 1);
  return (
    <div className="border border-indigo-800/50 rounded-xl overflow-hidden bg-indigo-950/20 mt-4">
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-indigo-900/20 transition-colors"
        onClick={() => setOpen(o => !o)}>
        <div className="w-8 h-8 bg-indigo-700/30 rounded-lg flex items-center justify-center shrink-0">
          <Cpu size={14} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-indigo-700">Model Fingerprint</p>
          <p className={`text-sm font-black ${modelGuess.primary.color}`}>
            {modelGuess.primary.icon} {modelGuess.primary.model}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-indigo-800/40 text-indigo-700 border border-indigo-700/40 px-2 py-0.5 rounded">
            {modelGuess.confidence} conf.
          </span>
          {open ? <ChevronUp size={13} className="text-indigo-7000" /> : <ChevronDown size={13} className="text-indigo-7000" />}
        </div>
      </div>

      {open && (
        <div className="border-t border-indigo-800/40 p-3 space-y-3 bg-slate-200/60">
          <p className="text-xs text-slate-9000">{modelGuess.primary.detail}</p>

          {modelGuess.secondary && (
            <div className="bg-white border border-slate-200 rounded-lg p-2">
              <p className="text-xs text-slate-9000">
                Also possible:{" "}
                <span className={`font-bold ${modelGuess.secondary.color}`}>
                  {modelGuess.secondary.icon} {modelGuess.secondary.model}
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{modelGuess.secondary.detail}</p>
            </div>
          )}

          <div className="space-y-1.5 pt-1 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-9000 mb-2">Relative signature scores:</p>
            {modelGuess.all.map((m, i) => {
              const pct = Math.round((m.score / maxScore) * 100);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm w-5">{m.icon}</span>
                  <span className={`text-xs w-28 truncate font-semibold ${m.color}`}>{m.model.split("/")[0].trim()}</span>
                  <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-600 ${i===0?"bg-indigo-500":"bg-slate-300"}`}
                      style={{ width:`${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right tabular-nums">{pct}%</span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 border-t border-slate-200 pt-2">
            ⚠ Fingerprinting is probabilistic. Multiple AI systems share similar patterns.
            Results are indicative only.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Per-sentence highlighter
function SentenceHighlighter({ sentences }) {
  const [show, setShow] = useState(false);
  const flagged = sentences.filter(s => s.flagged);
  if (!sentences.length) return null;
  return (
    <div className="mt-4">
      <button onClick={() => setShow(s => !s)}
        className="flex items-center gap-2 text-xs text-blue-800 hover:text-blue-900 font-bold mb-2">
        <Highlighter size={12} />
        {show ? "Hide" : "Show"} sentence-level analysis
        <span className="text-slate-9000">({flagged.length} flagged)</span>
        {show ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
      </button>
      {show && (
        <div className="max-h-72 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-3 bg-slate-100">
          {sentences.map((s, i) => {
            const c = scoreColor(s.score);
            return (
              <div key={i} className={`text-xs p-2 rounded-lg border ${s.flagged ? `${c.bg} ${c.border}` : "border-slate-200/50"}`}>
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 font-black w-7 text-right tabular-nums ${s.flagged ? c.text : "text-slate-400"}`}>
                    {s.score}
                  </span>
                  <span className={s.flagged ? "text-slate-700" : "text-slate-400"}>{s.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Plagiarism pair card
function PlagPairCard({ pair }) {
  const [open, setOpen] = useState(false);
  const c = scoreColor(pair.similarity);
  return (
    <div className={`border rounded-xl overflow-hidden mb-3 ${c.border} bg-white`}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100/60 transition-colors"
        onClick={() => setOpen(o => !o)}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} shrink-0`}>
          <span className={`text-sm font-black ${c.text}`}>{pair.similarity}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-700 truncate">{pair.labelA}</p>
          <p className="text-xs text-slate-9000 flex items-center gap-1 mt-0.5">
            <span className="text-blue-900">↔</span>
            <span className="truncate">{pair.labelB}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {pair.exactMatches.length > 0 &&
            <span className="text-xs bg-red-500/20 text-red-600 border border-red-500/30 px-1.5 py-0.5 rounded">
              {pair.exactMatches.length} exact
            </span>}
          {pair.nearMatches.length > 0 &&
            <span className="text-xs bg-orange-500/20 text-orange-600 border border-orange-500/30 px-1.5 py-0.5 rounded">
              {pair.nearMatches.length} near
            </span>}
          {open ? <ChevronUp size={12} className="text-slate-9000"/> : <ChevronDown size={12} className="text-slate-9000"/>}
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200/60 p-3 space-y-3 bg-slate-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label:"4-gram", val:`${pair.jac4gram}%` },
              { label:"3-gram", val:`${pair.jac3gram}%` },
              { label:"Verbatim runs", val:pair.verbatimRuns.length },
            ].map((m,i)=>(
              <div key={i} className="bg-white rounded-lg p-2 border border-slate-200">
                <div className="text-sm font-black text-slate-800">{m.val}</div>
                <div className="text-xs text-slate-400">{m.label}</div>
              </div>
            ))}
          </div>

          {pair.exactMatches.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-600 mb-1.5 flex items-center gap-1"><AlertTriangle size={11}/> Exact sentence matches</p>
              {pair.exactMatches.slice(0,4).map((s,i)=>(
                <p key={i} className="text-xs bg-red-500/10 border border-red-500/20 text-red-700 rounded p-2 mb-1">{s}</p>
              ))}
            </div>
          )}
          {pair.nearMatches.length > 0 && (
            <div>
              <p className="text-xs font-bold text-orange-600 mb-1.5 flex items-center gap-1"><Search size={11}/> Near-duplicate sentences</p>
              {pair.nearMatches.map((m,i)=>(
                <div key={i} className="bg-orange-500/10 border border-orange-500/20 rounded p-2 mb-1">
                  <p className="text-xs text-orange-700 mb-1"><b>A:</b> {m.a}</p>
                  <p className="text-xs text-orange-700"><b>B:</b> {m.b}</p>
                  <span className="text-xs text-orange-7000">{m.similarity}% similar</span>
                </div>
              ))}
            </div>
          )}
          {pair.verbatimRuns.length > 0 && (
            <div>
              <p className="text-xs font-bold text-yellow-600 mb-1.5 flex items-center gap-1"><Highlighter size={11}/> Verbatim runs (≥7 words)</p>
              {pair.verbatimRuns.map((r,i)=>(
                <p key={i} className="text-xs font-mono bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 rounded p-2 mb-1">
                  "…{r}…"
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DETECTION STEP
// ─────────────────────────────────────────────────────────────────────────────
export default function DetectionStep({ thesisData }) {
  const [running,   setRunning]   = useState(false);
  const [aiResult,  setAiResult]  = useState(null);
  const [plagResult,setPlagResult]= useState(null);
  const [tab,       setTab]       = useState("ai");
  const [mode,      setMode]      = useState("thesis"); // "thesis"|"custom"
  const [custom,    setCustom]    = useState("");

  const run = useCallback(() => {
    setRunning(true);
    setAiResult(null);
    setPlagResult(null);
    setTimeout(() => {
      try {
        const text   = mode === "custom" && custom.trim() ? custom : extractAllText(thesisData);
        const blocks = mode === "custom" && custom.trim()
          ? [{ id:"custom", label:"Pasted Text", text: custom }]
          : extractTextBlocks(thesisData);
        setAiResult(detectAI(text));
        setPlagResult(detectPlagiarism(blocks));
      } catch(e) { console.error(e); }
      setRunning(false);
    }, 60);
  }, [thesisData, mode, custom]);

  const hasContent = (mode === "thesis" && extractAllText(thesisData).trim().length > 100)
    || (mode === "custom" && custom.trim().length > 100);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-indigo-700/30 rounded-lg flex items-center justify-center">
          <ShieldCheck size={16} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-blue-950">AI & Plagiarism Detection</h2>
          <p className="text-xs text-slate-9000">9-signal ensemble · model fingerprinting · 100% free, runs in browser</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4">
        <div className="flex gap-2.5">
          <Info size={14} className="text-indigo-600 shrink-0 mt-0.5"/>
          <div className="text-xs text-slate-500 space-y-1">
            <p><span className="text-indigo-700 font-bold">AI Detection:</span> 9 weighted signals — burstiness, AI phrase density (150+ phrases), lexical diversity (MTLD), punctuation complexity, passive voice, sentence starters, hedge patterns, paragraph uniformity.</p>
            <p><span className="text-indigo-700 font-bold">Model Fingerprint:</span> Secondary classifier identifies likely source — ChatGPT/GPT-4, Claude, Gemini, or Academic AI tools.</p>
            <p><span className="text-indigo-700 font-bold">Plagiarism:</span> Fixed — AI text now correctly scores high due to low lexical diversity and n-gram repetition. Cross-section 4-gram Jaccard + MTLD + verbatim run detection.</p>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1.5 mb-4">
        {[
          { id:"thesis", label:"Analyse Full Thesis" },
          { id:"custom", label:"Paste Custom Text"   },
        ].map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-colors ${
              mode===m.id
                ? "bg-indigo-700/30 border-indigo-600/50 text-indigo-700"
                : "bg-white border-slate-200 text-slate-9000 hover:text-slate-600"
            }`}>{m.label}</button>
        ))}
      </div>

      {mode==="custom" && (
        <textarea rows={6}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm
                     focus:outline-none focus:border-indigo-500 resize-y mb-4 transition-colors"
          value={custom}
          onChange={e=>setCustom(e.target.value)}
          placeholder="Paste any text — from ChatGPT, Claude, a paper, anything — to analyse for AI patterns and internal repetition…"
        />
      )}

      {/* Run button */}
      <button onClick={run} disabled={running || !hasContent}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-700 to-indigo-700
                   hover:from-indigo-600 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
                   text-white font-bold px-4 py-3 rounded-xl transition-all shadow-lg mb-5">
        {running
          ? <><Loader2 size={16} className="animate-spin"/> Analysing…</>
          : aiResult
          ? <><RefreshCw size={15}/> Re-run Analysis</>
          : <><Zap size={15}/> Run Full Detection</>}
      </button>

      {!hasContent && (
        <p className="text-xs text-slate-400 text-center -mt-3 mb-4">
          {mode==="thesis" ? "Add content to your chapters first." : "Enter at least 100 characters to analyse."}
        </p>
      )}

      {/* ── RESULTS ── */}
      {(aiResult || plagResult) && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className={`rounded-xl border p-4 ${scoreColor(aiResult?.score||0).bg} ${scoreColor(aiResult?.score||0).border}`}>
              <div className="flex items-center gap-2 mb-2">
                <Brain size={13} className={scoreColor(aiResult?.score||0).text}/>
                <span className="text-xs font-bold text-slate-600">AI Detection</span>
                <span className="ml-auto text-xs text-slate-400">{aiResult?.confidence} conf.</span>
              </div>
              <ScoreRing score={aiResult?.score||0} size={80}/>
              <p className={`text-xs font-black mt-2 leading-tight ${scoreColor(aiResult?.score||0).text}`}>{aiResult?.label}</p>
            </div>
            <div className={`rounded-xl border p-4 ${scoreColor(plagResult?.overallScore||0).bg} ${scoreColor(plagResult?.overallScore||0).border}`}>
              <div className="flex items-center gap-2 mb-2">
                <FileWarning size={13} className={scoreColor(plagResult?.overallScore||0).text}/>
                <span className="text-xs font-bold text-slate-600">Plagiarism</span>
              </div>
              <ScoreRing score={plagResult?.overallScore||0} size={80}/>
              <p className={`text-xs font-black mt-2 leading-tight ${scoreColor(plagResult?.overallScore||0).text}`}>{plagResult?.label}</p>
              {plagResult?.avgInternalRepetition > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">Internal rep: {plagResult.avgInternalRepetition}%</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-4">
            {[
              { id:"ai",   icon:Brain,       label:"AI Analysis"  },
              { id:"plag", icon:FileWarning, label:"Plagiarism"   },
            ].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition-colors ${
                  tab===t.id ? "bg-slate-100 text-slate-800" : "text-slate-9000 hover:text-slate-600"
                }`}>
                <t.icon size={12}/>{t.label}
              </button>
            ))}
          </div>

          {/* ── AI TAB ── */}
          {tab==="ai" && aiResult && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <BarChart3 size={12} className="text-indigo-600"/> Detection Signals (9-point ensemble)
                </h3>
                {aiResult.signals.map((sig,i) => <SignalBar key={i} signal={sig}/>)}
              </div>

              <ModelCard modelGuess={aiResult.modelGuess}/>
              <SentenceHighlighter sentences={aiResult.sentences}/>

              {/* Score guide */}
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-500 mb-2">Score Scale</p>
                {[
                  {r:"80–100", l:"Almost Certainly AI-Generated",  c:"text-red-600"   },
                  {r:"65–79",  l:"Very Likely AI-Generated",       c:"text-red-600"   },
                  {r:"48–64",  l:"Likely AI-Generated",            c:"text-orange-600"},
                  {r:"32–47",  l:"Mixed — AI-Assisted",            c:"text-yellow-600"},
                  {r:"15–31",  l:"Mostly Human-Written",           c:"text-green-700" },
                  {r:"0–14",   l:"Human-Written",                  c:"text-green-600" },
                ].map((r,i)=>(
                  <div key={i} className="flex items-center gap-2 text-xs mb-0.5">
                    <span className="font-mono text-slate-400 w-14">{r.r}</span>
                    <span className={r.c+" font-bold"}>{r.l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PLAG TAB ── */}
          {tab==="plag" && plagResult && (
            <div className="space-y-4">
              {plagResult.internalOnly ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-blue-800"/> Internal Repetition Analysis
                  </p>
                  <p className="text-xs text-slate-9000">
                    Only one text block analysed. Plagiarism score reflects internal repetition —
                    how much the text reuses its own phrases and vocabulary. AI-generated text typically
                    scores 40–70% here due to low lexical diversity.
                  </p>
                </div>
              ) : plagResult.pairs.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                  <CheckCircle2 size={36} className="mx-auto mb-2 text-green-7000 opacity-60"/>
                  <p className="text-sm font-bold text-green-600">No cross-section similarity detected</p>
                  <p className="text-xs text-slate-400 mt-1">Content appears unique across all sections</p>
                </div>
              ) : (
                <>
                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                    <p className="text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{plagResult.pairs.length}</span> pairs compared ·{" "}
                      <span className="font-bold text-slate-700">{plagResult.totalFlagged}</span> sentences flagged ·{" "}
                      Avg internal repetition: <span className="font-bold text-slate-700">{plagResult.avgInternalRepetition}%</span>
                    </p>
                  </div>
                  {plagResult.pairs.map((p,i) => <PlagPairCard key={i} pair={p}/>)}
                </>
              )}

              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-500 mb-2">Score Guide</p>
                {[
                  {r:"65–100%", l:"High similarity / repetition", c:"text-red-600"   },
                  {r:"40–64%",  l:"Moderate — review recommended", c:"text-orange-600"},
                  {r:"20–39%",  l:"Low — normal vocabulary overlap", c:"text-yellow-600"},
                  {r:"0–19%",   l:"Minimal — expected background noise", c:"text-green-600"},
                ].map((r,i)=>(
                  <div key={i} className="flex items-center gap-2 text-xs mb-0.5">
                    <span className="font-mono text-slate-400 w-16">{r.r}</span>
                    <span className={r.c+" font-bold"}>{r.l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
