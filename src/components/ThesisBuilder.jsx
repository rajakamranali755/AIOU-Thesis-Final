import { useState, useEffect, useRef } from "react";
import {
  GraduationCap, BookMarked, BookOpen, List, Eye,
  ChevronRight, ChevronLeft, Star, Check,
  FileDown, Printer, Info, ShieldCheck, Layers, FileText, Search, Users,
  UploadCloud, Download, ChevronDown, LogOut, Save,
  User, Library, Megaphone, MessagesSquare, Calendar,
} from "lucide-react";

import CoverStep        from "./CoverStep";
import PreliminaryStep  from "./PreliminaryStep";
import ChaptersStep     from "./ChaptersStep";
import ReferencesStep   from "./ReferencesStep";
import PreviewPane      from "./PreviewPane";
import TemplateSelector from "./TemplateSelector";
import ArticleBuilder   from "./ArticleBuilder";
import ThesisLibrary    from "./ThesisLibrary";
import ScholarHub       from "./ScholarHub";
import { SAMPLE_DATA }  from "../data/sampleData";
import { addProject }   from "../utils/scholarStore";
import { TEMPLATES, getTemplateFontUrl } from "../data/themeTemplates";
import { printDocument } from "../utils/wordExport";
import { downloadViewerPdf } from "../utils/pdfExport";
import { downloadThesisDocx } from "../utils/docxExport";

const STEPS = [
  { id: "template",    label: "Template",        icon: Layers      },
  { id: "cover",       label: "Cover Page",       icon: GraduationCap },
  { id: "preliminary", label: "Preliminary",      icon: BookMarked  },
  { id: "chapters",    label: "Chapters",         icon: BookOpen    },
  { id: "references",  label: "References",       icon: List        },
  { id: "library",     label: "Find Theses",      icon: Search      },
  { id: "preview",     label: "Preview & Export", icon: Eye         },
];

const SCHOLAR_ITEMS = [
  { id: "profile",     label: "Profile",     icon: User },
  { id: "library",     label: "My Library",  icon: Library },
  { id: "discussions", label: "Discussions", icon: Megaphone },
  { id: "chats",       label: "Group Chats", icon: MessagesSquare },
  { id: "meetings",    label: "Meetings",    icon: Calendar },
];

const EMPTY = {
  cover: {
    title:"", authorName:"", registrationNo:"", degree:"",
    degreeAbbr:"", subject:"", department:"", university:"",
    session:"", supervisor:"", supervisorDesignation:"", faculty:"",
  },
  preliminary: { acknowledgement:"", dedication:"", declaration:"", abstract:"" },
  chapters: [],
  references: [],
};

export default function ThesisBuilder({ user = null, onSignOut = () => {} }) {
  const [mode,        setMode]        = useState("thesis"); // "thesis" | "article" | "scholar"
  const [step,        setStep]        = useState(0);
  const [data,        setData]        = useState(EMPTY);
const [templateId,  setTemplateId]  = useState("aiou");
  const [sampleLoaded,setSampleLoaded]= useState(false);
  const [sampleMenu,  setSampleMenu]  = useState(false);
  const [importing,   setImporting]   = useState(false);
  const sampleFileRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [projectSaved,setProjectSaved]= useState(false);
  const [articleInitial, setArticleInitial] = useState(null);
  const [articleKey,  setArticleKey]  = useState(0);
  const [scholarTab,  setScholarTab]  = useState("profile");

  // Save the current thesis project to the signed-in user's library.
  const saveProjectToLibrary = () => {
    if (!user) return;
    addProject(user.id, { title: data.cover?.title || "Untitled thesis", type: "thesis", templateId, data });
    window.dispatchEvent(new Event("scholarhub-library-changed"));
    setProjectSaved(true);
    setTimeout(() => setProjectSaved(false), 2000);
  };

  // Open a saved project (from My Library) back into the builder.
  const loadProject = (p) => {
    if (p.type === "article") {
      setArticleInitial(p.data);
      setArticleKey(k => k + 1);
      setMode("article");
    } else {
      setData({ ...EMPTY, ...p.data });
      if (p.templateId && TEMPLATES[p.templateId]) setTemplateId(p.templateId);
      setMode("thesis");
      setStep(0);
    }
  };

  const tpl = TEMPLATES[templateId] || TEMPLATES.aiou;

  // Select a template and, if it carries programme defaults (e.g. an AIOU
  // variant), prefill any title-page fields the user hasn't filled in yet.
  // Existing values are never overwritten.
  const selectTemplate = (id) => {
    setTemplateId(id);
    const next = TEMPLATES[id];
    if (next?.defaults) {
      setData(d => {
        const cover = { ...(d.cover || {}) };
        for (const [k, v] of Object.entries(next.defaults)) {
          if (!cover[k] || String(cover[k]).trim() === "") cover[k] = v;
        }
        return { ...d, cover };
      });
    }
  };

  // Load Google Font when Urdu template is selected
  useEffect(() => {
    const fontUrl = getTemplateFontUrl(templateId);
    if (!fontUrl) return;
    if (document.querySelector(`link[href="${fontUrl}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = fontUrl;
    document.head.appendChild(link);
  }, [templateId]);

  const upd = (key) => (val) => setData(d => ({ ...d, [key]: val }));

  const loadSample = () => {
    setData(SAMPLE_DATA);
    setSampleLoaded(true);
    setSampleMenu(false);
    setTimeout(() => setSampleLoaded(false), 2500);
  };

  const handleUploadSample = async (file) => {
    setSampleMenu(false);
    if (!file) return;
    setImporting(true);
    try {
      const { importSampleFile } = await import("../utils/sampleImport");
      const { data: incoming, templateId: tid } = await importSampleFile(file, EMPTY);
      setData(incoming);
      if (tid && TEMPLATES[tid]) setTemplateId(tid);
      setSampleLoaded(true);
      setTimeout(() => setSampleLoaded(false), 2500);
    } catch (e) {
      alert(e?.message || "Couldn't import that file.");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSample = () => {
    setSampleMenu(false);
    const payload = JSON.stringify({ templateId, data }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.cover?.title || "thesis-sample").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    // Make sure the full-scale preview is mounted, then capture it 1:1 to PDF.
    setStep(6);
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 800));
    try {
      const name = (data.cover.authorName || "Thesis").replace(/\s+/g, "_");
      await downloadViewerPdf(`${name}_Thesis.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("Could not generate the PDF. Please open the Preview tab and try again.");
    }
    setDownloading(false);
  };

  const handleDownloadWord = async () => {
    setDownloading(true);
    try {
      const name = (data.cover.authorName || "Thesis").replace(/\s+/g, "_");
      await downloadThesisDocx(data, `${name}_Thesis.docx`, templateId);
    } catch (e) {
      console.error("Word export failed:", e);
      alert("Sorry, the Word document could not be generated. Please try again.");
    }
    setDownloading(false);
  };

  const handlePrint = () => printDocument(data, templateId);

  const completeness = (() => {
    let n = 0;
    if (data.cover.title && data.cover.authorName) n++;
    if (data.preliminary.abstract) n++;
    if (data.chapters.length > 0) n++;
    if (data.references.length > 0) n++;
    return Math.round((n / 4) * 100);
  })();

  const isPreview = STEPS[step]?.id === "preview";
  const isRTL     = tpl.direction === "rtl";

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-800 flex flex-col" style={{ fontFamily: "Georgia, serif" }}>

      {/* ── HEADER ── */}
      <header className="bg-gradient-to-r from-blue-100 via-indigo-100 to-blue-200 border-b-2 border-indigo-200 px-5 py-3 flex items-center gap-3 sticky top-0 z-50 shadow-md shadow-blue-200/50 no-print">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-700 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-300 shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="hidden md:block min-w-0">
            <h1 className="font-bold text-blue-950 text-sm leading-tight tracking-wide">
              Academic Writing Suite
            </h1>
            <p className="text-slate-9000 text-xs flex items-center gap-1.5">
              {mode === "thesis" ? (
                <>
                  <span className={`text-xs px-1.5 py-0 rounded font-bold text-white ${tpl.badgeColor}`}>
                    {tpl.badge}
                  </span>
                  {tpl.name} · {tpl.referenceStyle}
                  {isRTL && <span className="text-rose-600 font-bold">· RTL اردو</span>}
                </>
              ) : (
                <span className="text-blue-600 font-bold">Article Builder · English & Urdu</span>
              )}
            </p>
          </div>
        </div>

        {/* ── MODE TABS (inline, no overlap) ── */}
        <div className="flex gap-1 bg-white/70 backdrop-blur border border-indigo-200 rounded-xl p-1 shadow-sm shrink-0">
          <button
            onClick={() => setMode("thesis")}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              mode === "thesis"
                ? "bg-gradient-to-r from-blue-800 to-indigo-700 text-white shadow"
                : "text-slate-9000 hover:text-slate-700"
            }`}
          >
            <GraduationCap size={13} />
            <span className="hidden sm:inline">Thesis Builder</span>
            <span className="sm:hidden">Thesis</span>
          </button>
          <button
            onClick={() => setMode("article")}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              mode === "article"
                ? "bg-gradient-to-r from-indigo-700 to-blue-700 text-white shadow"
                : "text-slate-9000 hover:text-slate-700"
            }`}
          >
            <FileText size={13} />
            <span className="hidden sm:inline">Article Builder</span>
            <span className="sm:hidden">Article</span>
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 shrink-0">
          {mode === "thesis" && (
            <>
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500"
                       style={{ width:`${completeness}%` }} />
                </div>
                <span className="text-xs text-slate-500 tabular-nums">{completeness}%</span>
              </div>

              <div className="relative hidden sm:block">
                <button onClick={() => setSampleMenu(m => !m)} disabled={importing}
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-blue-300/60 text-blue-900 text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-60">
                  {importing ? <Star size={13} className="animate-pulse"/> : sampleLoaded ? <Check size={13} className="text-green-600"/> : <Star size={13}/>}
                  {importing ? "Importing…" : sampleLoaded ? "Loaded!" : "Sample"}
                  <ChevronDown size={12} className={`transition-transform ${sampleMenu ? "rotate-180" : ""}`}/>
                </button>
                {sampleMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSampleMenu(false)} />
                    <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden p-1">
                      <button onClick={loadSample}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 rounded-lg transition-colors">
                        <Star size={14} className="text-blue-700 shrink-0"/>
                        <span>Load built-in sample</span>
                      </button>
                      <button onClick={() => sampleFileRef.current?.click()}
                        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 rounded-lg transition-colors">
                        <UploadCloud size={14} className="text-blue-700 shrink-0 mt-0.5"/>
                        <span>Upload from device<br/><span className="font-normal text-slate-400">Word (.docx), PDF, .txt or .json</span></span>
                      </button>
                      <button onClick={handleDownloadSample}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 rounded-lg transition-colors">
                        <Download size={14} className="text-blue-700 shrink-0"/>
                        <span>Save current as sample (.json)</span>
                      </button>
                    </div>
                  </>
                )}
                <input ref={sampleFileRef} type="file"
                  accept=".json,application/json,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf,.txt,text/plain"
                  className="hidden"
                  onChange={(e) => { handleUploadSample(e.target.files[0]); e.target.value = ""; }} />
              </div>

              <button onClick={handlePrint}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                <Printer size={13}/>
                <span className="hidden sm:inline">Print</span>
              </button>

              <button onClick={handleDownload} disabled={downloading}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-900 hover:to-indigo-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow">
                <FileDown size={13}/>
                {downloading ? "Generating…" : "Download PDF"}
              </button>

              <button onClick={handleDownloadWord} disabled={downloading} title="Editable Word file with the selected template's rules applied"
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-50 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                <FileDown size={13}/>
                <span className="hidden sm:inline">Word</span>
              </button>

              {user && (
                <button onClick={saveProjectToLibrary}
                  className="hidden sm:flex items-center gap-1.5 bg-white border border-indigo-300 hover:border-indigo-400 text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                  {projectSaved ? <Check size={13} className="text-green-600"/> : <Save size={13}/>}
                  {projectSaved ? "Saved!" : "Save to Library"}
                </button>
              )}
            </>
          )}

          {/* Account — header only in Article mode (no sidebar there); thesis/scholar use the sidebar footer */}
          {user && mode === "article" && (
            <>
              <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-700 to-indigo-600 text-white text-[11px] font-extrabold flex items-center justify-center uppercase">{(user.name || "S").charAt(0)}</div>
                <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">{user.name}</span>
              </div>
              <button onClick={onSignOut} title="Sign out"
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-red-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                <LogOut size={13}/><span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── ARTICLE BUILDER MODE ── */}
        {mode === "article" && (
          <ArticleBuilder key={articleKey} user={user} initial={articleInitial} />
        )}

        {/* ── BUILDER + SCHOLAR HUB (shared sidebar) ── */}
        {(mode === "thesis" || mode === "scholar") && (
        <>
        {/* ── SIDEBAR ── */}
        <aside className="w-56 bg-gradient-to-b from-white via-blue-50 to-indigo-100 border-r border-indigo-200 flex flex-col shrink-0 overflow-y-auto no-print">
          <nav className="p-3 flex-1">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold px-2 mb-3">Build</p>
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const active = mode === "thesis" && step === idx;
              const isTpl  = s.id === "template";
              const activeColor = isTpl ? "bg-gradient-to-r from-blue-600/25 to-indigo-600/30 border-blue-500/50 text-blue-700"
                                :         "bg-gradient-to-r from-blue-700/25 to-indigo-600/30 border-blue-500/50 text-blue-900";
              const iconBg = isTpl ? "bg-blue-700" : "bg-blue-800";
              const iconTxt = isTpl ? "text-blue-700" : "text-blue-900";
              return (
                <button key={s.id} onClick={() => { setMode("thesis"); setStep(idx); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-left transition-all font-bold ${
                    active ? `${activeColor} border` : "text-slate-9000 hover:bg-slate-50 hover:text-slate-600"
                  }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${active ? iconBg : "bg-slate-50"}`}>
                    <Icon size={12} className={active ? iconTxt : "text-slate-9000"} />
                  </div>
                  <span className="text-xs truncate">{s.label}</span>
                  {active && <ChevronRight size={12} className="ml-auto shrink-0 text-blue-800" />}
                </button>
              );
            })}

            {/* Scholar Hub section */}
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold px-2 mb-3 mt-5">Scholar Hub</p>
            {SCHOLAR_ITEMS.map((s) => {
              const Icon = s.icon;
              const active = mode === "scholar" && scholarTab === s.id;
              return (
                <button key={s.id} onClick={() => { setMode("scholar"); setScholarTab(s.id); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-left transition-all font-bold ${
                    active ? "bg-gradient-to-r from-indigo-600/25 to-indigo-700/30 border border-indigo-500/50 text-indigo-700" : "text-slate-9000 hover:bg-slate-50 hover:text-slate-600"
                  }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-indigo-700" : "bg-slate-50"}`}>
                    <Icon size={12} className={active ? "text-indigo-700" : "text-slate-9000"} />
                  </div>
                  <span className="text-xs truncate">{s.label}</span>
                  {active && <ChevronRight size={12} className="ml-auto shrink-0 text-indigo-700" />}
                </button>
              );
            })}
          </nav>

          {/* Template mini-info (thesis mode only) */}
          {mode === "thesis" && (
          <div className="p-3 m-3 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-indigo-200 text-xs space-y-1">
            <p className="font-bold text-slate-9000 flex items-center gap-1 mb-1.5"><Info size={10}/> Active Template</p>
            <p className={`font-bold text-white text-xs px-1.5 py-0.5 rounded inline-block ${tpl.badgeColor}`}>{tpl.badge}</p>
            <p className="text-slate-9000">{tpl.name}</p>
            <p className="text-slate-400">{tpl.referenceStyle} · {tpl.direction.toUpperCase()}</p>
            {isRTL && <p className="text-rose-7000 font-bold">اردو RTL Active</p>}
          </div>
          )}

          {/* Account footer — pinned to the bottom of the sidebar */}
          {user && (
            <div className="mt-auto p-3 border-t border-indigo-200 bg-white/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-700 to-indigo-600 text-white text-xs font-extrabold flex items-center justify-center uppercase shrink-0">{(user.name || "S").charAt(0)}</div>
                <span className="text-xs font-bold text-slate-700 truncate">{user.name}</span>
              </div>
              <button onClick={onSignOut}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                <LogOut size={13}/> Sign out
              </button>
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex overflow-hidden min-w-0">
          {mode === "scholar" ? (
            <ScholarHub user={user} tab={scholarTab} onLoadProject={loadProject} />
          ) : !isPreview ? (
            <>
              <div className="flex-1 overflow-y-auto min-w-0">
                <div className="max-w-4xl mx-auto px-8 py-8">

                  <div className="sm:hidden mb-4">
                    <button onClick={loadSample}
                      className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-blue-300/60 text-blue-900 text-xs font-bold px-3 py-2.5 rounded-lg">
                      {sampleLoaded ? <Check size={13} className="text-green-600"/> : <Star size={13}/>}
                      {sampleLoaded ? "Loaded!" : "Load Generic Sample Thesis"}
                    </button>
                  </div>

                  {step === 0 && <TemplateSelector selectedId={templateId} onSelect={selectTemplate} />}
                  {step === 1 && <CoverStep        data={data.cover}       onChange={upd("cover")} templateId={templateId} />}

                  {step === 2 && <PreliminaryStep  data={data.preliminary} onChange={upd("preliminary")} templateId={templateId} cover={data.cover} />}
                  {step === 3 && <ChaptersStep     data={data.chapters}    onChange={upd("chapters")} />}
                  {step === 4 && <ReferencesStep   data={data.references}  onChange={upd("references")} chapters={data.chapters} />}
                  {step === 5 && <ThesisLibrary    defaultQuery={data.cover?.title} />}

                  {/* Nav */}
                  <div className="flex justify-between items-center mt-10 pt-5 border-t border-slate-200">
                    <button onClick={() => setStep(s => Math.max(0,s-1))} disabled={step===0}
                      className="flex items-center gap-1.5 text-sm text-slate-9000 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
                      <ChevronLeft size={16}/> Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {STEPS.map((_,i) => (
                        <button key={i} onClick={() => setStep(i)}
                          className={`h-2 rounded-full transition-all ${i===step?"bg-blue-600 w-5":i<step?"bg-blue-900 w-2":"bg-slate-100 w-2"}`}/>
                      ))}
                    </div>
                    <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s+1))}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-900 hover:to-indigo-800 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors shadow">
                      {step === STEPS.length - 2 ? "Preview" : "Next"} <ChevronRight size={16}/>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live mini-preview */}
              {step !== 5 && (
                <div className="hidden xl:flex flex-col w-[440px] shrink-0 bg-slate-50 border-l border-slate-200 overflow-hidden no-print">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white">
                    <Eye size={13} className="text-blue-800"/>
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Live Preview</span>
                    <span className={`ml-1 text-xs font-bold text-white px-1.5 py-0 rounded ${tpl.badgeColor}`}>{tpl.badge}</span>
                    <button onClick={() => setStep(6)} className="ml-auto text-xs text-slate-9000 hover:text-blue-900 transition-colors">
                      Full →
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
                    <div style={{ transform:"scale(0.5)", transformOrigin:"top left", width:"200%", pointerEvents:"none" }}>
                      <PreviewPane data={data} templateId={templateId}/>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── FULL PREVIEW ── */
            <div className="flex-1 bg-slate-50 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between no-print">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep(5)}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50">
                    <ChevronLeft size={15}/> Back
                  </button>
                  <div className="w-px h-5 bg-slate-100"/>
                  <Eye size={14} className="text-blue-800"/>
                  <span className="text-sm font-bold text-blue-950">Document Preview</span>
                  <span className={`text-xs font-bold text-white px-2 py-0.5 rounded ${tpl.badgeColor}`}>{tpl.badge}</span>
                  <span className="hidden sm:inline text-xs bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                    {tpl.name} · {tpl.referenceStyle} · {isRTL?"RTL Urdu":"LTR"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-blue-700/40 text-blue-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                    <Layers size={13}/> Change Template
                  </button>
                  <button onClick={handlePrint}
                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                    <Printer size={13}/> Print
                  </button>
                  <button onClick={handleDownload} disabled={downloading}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-900 hover:to-indigo-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow">
                    <FileDown size={13}/>
                    {downloading ? "Generating…" : "Download PDF"}
                  </button>
                  <button onClick={handleDownloadWord} disabled={downloading} title="Editable Word file with the selected template's rules applied"
                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-50 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                    <FileDown size={13}/> Word
                  </button>
                </div>
              </div>
              <div className="p-6 md:p-10">
                <PreviewPane data={data} templateId={templateId}/>
              </div>
            </div>
          )}
        </main>
        </>
        )}
      </div>
    </div>
  );
}
