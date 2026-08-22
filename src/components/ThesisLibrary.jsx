import { useState } from "react";
import {
  Search, Download, ExternalLink, Loader2, AlertCircle,
  Library, FileText, Newspaper, GraduationCap, Building2,
  SlidersHorizontal, BookmarkPlus, Check,
} from "lucide-react";
import { getCurrentUser, getLibrary, saveLibrary } from "../utils/scholarStore";

/**
 * ThesisLibrary
 * Searches the OpenAlex open-access index for theses (and optionally journal
 * articles) matching a topic, listing only items with a downloadable file.
 * Filters: include journal articles, year range, and Pakistani repositories.
 * If a thesis-only search returns very few hits, it automatically broadens to
 * include journal articles so the user still gets useful results.
 */
const NOW = new Date().getFullYear();

function buildUrl({ q, withArticles, pakOnly, fromYear, toYear }) {
  const filters = [
    withArticles ? "type:dissertation|article" : "type:dissertation",
    "open_access.is_oa:true",
  ];
  if (fromYear) filters.push(`from_publication_date:${fromYear}-01-01`);
  if (toYear)   filters.push(`to_publication_date:${toYear}-12-31`);
  if (pakOnly)  filters.push("authorships.institutions.country_code:pk");
  return (
    "https://api.openalex.org/works" +
    `?search=${encodeURIComponent(q)}` +
    `&filter=${filters.join(",")}` +
    "&per-page=25" +
    // Using the "polite pool" (a contact param) gives more reliable service and
    // far fewer 429/503 responses than anonymous requests.
    "&mailto=wajahatmirza040@gmail.com"
  );
}

const pickPdf = (w) =>
  w?.best_oa_location?.pdf_url ||
  w?.open_access?.oa_url ||
  w?.primary_location?.pdf_url ||
  w?.best_oa_location?.landing_page_url ||
  w?.primary_location?.landing_page_url ||
  null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWorks(url, retries = 3) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      // Transient: service unavailable / gateway / rate-limited → wait & retry.
      if (res.status === 503 || res.status === 502 || res.status === 504 || res.status === 429) {
        lastErr = new Error(`Search service returned ${res.status}`);
        if (attempt < retries) { await sleep(700 * (attempt + 1)); continue; }
        throw lastErr;
      }
      if (!res.ok) throw new Error(`Search service returned ${res.status}`);
      const json = await res.json();
      return (json.results || [])
        .map((w) => ({
          id: w.id,
          title: w.title || w.display_name || "Untitled",
          year: w.publication_year || "—",
          type: w.type === "dissertation" ? "Thesis" : "Article",
          authors: (w.authorships || []).map((a) => a.author?.display_name).filter(Boolean),
          source:
            w.primary_location?.source?.display_name ||
            w.best_oa_location?.source?.display_name || "",
          pdf: pickPdf(w),
          landing: w.primary_location?.landing_page_url || w.id,
        }))
        .filter((it) => it.pdf);
    } catch (e) {
      lastErr = e;
      // Network blip → retry; on the last attempt, give up.
      if (attempt < retries && /Failed to fetch|NetworkError|returned 5\d\d|returned 429/i.test(e.message)) {
        await sleep(700 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error("Search failed");
}

const yr = (v) => (/^\d{4}$/.test(v) ? v : null);

export default function ThesisLibrary({ defaultQuery = "" }) {
  const [query, setQuery]       = useState(defaultQuery || "");
  const [status, setStatus]     = useState("idle"); // idle | loading | done | error
  const [results, setResults]   = useState([]);
  const [error, setError]       = useState("");
  const [searched, setSearched] = useState("");
  const [note, setNote]         = useState("");

  // filters
  const [includeArticles, setIncludeArticles] = useState(false);
  const [pakOnly, setPakOnly]   = useState(false);
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear]     = useState("");

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setStatus("loading"); setError(""); setResults([]); setNote(""); setSearched(q);

    const base = { q, pakOnly, fromYear: yr(fromYear), toYear: yr(toYear) };
    // Pakistani open-access dissertations are sparse in the index, so when that
    // filter is on we include journal articles too (otherwise results are empty).
    const effectiveArticles = includeArticles || pakOnly;
    try {
      let items = await fetchWorks(buildUrl({ ...base, withArticles: effectiveArticles }));
      let info = "";
      if (pakOnly && !includeArticles && items.length) {
        info = "Showing Pakistani-affiliated theses and journal articles (open-access dissertations alone are scarce in the index).";
      }

      // Auto-broaden: few theses → also pull journal articles.
      if (!effectiveArticles && items.length < 3) {
        const broadened = await fetchWorks(buildUrl({ ...base, withArticles: true }));
        if (broadened.length > items.length) {
          items = broadened;
          info = "Few theses matched, so open-access journal articles are included too.";
        }
      }
      setResults(items); setNote(info); setStatus("done");
    } catch (e) {
      const msg = e?.message || "";
      setError(
        /Failed to fetch|NetworkError/i.test(msg)
          ? "Couldn't reach the search service. Check your internet connection and try again."
          : /returned (503|502|504|429)/.test(msg)
          ? "The open-access search service (OpenAlex) is temporarily busy or rate-limited. Please wait a few seconds and try again."
          : msg || "Something went wrong while searching."
      );
      setStatus("error");
    }
  };

  const onKey = (e) => { if (e.key === "Enter") runSearch(); };
  const download = (it) => window.open(it.pdf, "_blank", "noopener,noreferrer");

  const [savedIds, setSavedIds] = useState(() => new Set());
  const saveToLibrary = (it) => {
    const user = getCurrentUser();
    if (!user) {
      alert("Please sign in to the Scholar Hub (top tab) to save papers to your library.");
      return;
    }
    try {
      const cur = getLibrary(user.id);
      if (!cur.some((x) => x.title === it.title && String(x.year) === String(it.year))) {
        const entry = { id: Date.now(), title: it.title, authors: it.authors.join(", "), year: it.year, link: it.pdf || it.landing };
        saveLibrary(user.id, [entry, ...cur]);
        window.dispatchEvent(new Event("scholarhub-library-changed"));
      }
      setSavedIds((s) => new Set(s).add(it.id));
    } catch { /* ignore */ }
  };

  const Toggle = ({ active, onClick, icon: Icon, children }) => (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
        active
          ? "bg-blue-800 text-white border-blue-800 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
      }`}>
      <Icon size={13} /> {children}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-blue-800/30 rounded-lg flex items-center justify-center">
          <Library size={16} className="text-blue-800" />
        </div>
        <div>
          <h2 className="text-base font-bold text-blue-950">Find &amp; Download Theses</h2>
          <p className="text-xs text-slate-9000">
            Search open-access research by topic — only downloadable items are listed.
          </p>
        </div>
      </div>

      {/* Search box */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={query}
            onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey}
            placeholder="e.g. machine learning in healthcare, renewable energy, urban poverty…"
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
          />
        </div>
        <button onClick={runSearch} disabled={status === "loading" || !query.trim()}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-900 hover:to-indigo-800
                     disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
          {status === "loading" ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Search
        </button>
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
          <SlidersHorizontal size={12} /> Filters
        </span>
        <Toggle active={includeArticles} onClick={() => setIncludeArticles(v => !v)} icon={Newspaper}>
          Include journal articles
        </Toggle>
        <Toggle active={pakOnly} onClick={() => setPakOnly(v => !v)} icon={Building2}>
          Pakistani repositories only
        </Toggle>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
          <span className="text-xs font-bold text-slate-500">Year</span>
          <input type="number" value={fromYear} onChange={(e) => setFromYear(e.target.value)}
            placeholder="From" min="1950" max={NOW}
            className="w-16 text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-300" />
          <span className="text-slate-300">–</span>
          <input type="number" value={toYear} onChange={(e) => setToYear(e.target.value)}
            placeholder="To" min="1950" max={NOW}
            className="w-16 text-xs text-slate-800 bg-transparent focus:outline-none placeholder-slate-300" />
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-2">
        Results come from the OpenAlex open-access index. <span className="font-semibold text-blue-700">Download</span> opens the full PDF.
      </p>

      {/* States */}
      {status === "loading" && (
        <div className="text-center py-14 text-slate-400">
          <Loader2 size={28} className="mx-auto mb-3 animate-spin text-blue-700" />
          <p className="text-sm">Searching open-access research for “{searched}”…</p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-5 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Search failed</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            <button onClick={runSearch}
              className="mt-2 inline-flex items-center gap-1.5 bg-white border border-red-200 hover:border-red-300 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              <Loader2 size={12} /> Try again
            </button>
          </div>
        </div>
      )}

      {status === "done" && results.length === 0 && (
        <div className="text-center py-14 text-slate-400">
          <FileText size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No downloadable results found for “{searched}”.</p>
          <p className="text-xs mt-1">Try broader keywords, widen the year range, or enable journal articles.</p>
        </div>
      )}

      {status === "done" && results.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
            <p className="text-xs font-bold text-blue-950 uppercase tracking-widest">
              {results.length} downloadable {results.length === 1 ? "result" : "results"}
            </p>
          </div>
          {note && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
              <Newspaper size={13} className="shrink-0" /> {note}
            </p>
          )}
          <div className="space-y-3">
            {results.map((it) => (
              <div key={it.id}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                    {it.type === "Thesis"
                      ? <GraduationCap size={16} className="text-blue-800" />
                      : <Newspaper size={16} className="text-indigo-700" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-bold text-slate-800 leading-snug flex-1">{it.title}</p>
                      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        it.type === "Thesis" ? "bg-blue-100 text-blue-800" : "bg-indigo-100 text-indigo-700"
                      }`}>{it.type}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {it.authors.length ? it.authors.slice(0, 3).join(", ") : "Unknown author"}
                      {it.authors.length > 3 ? " et al." : ""} · {it.year}
                      {it.source ? ` · ${it.source}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button onClick={() => download(it)}
                        className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        <Download size={13} /> Download
                      </button>
                      <a href={it.landing} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        <ExternalLink size={13} /> Source page
                      </a>
                      <button onClick={() => saveToLibrary(it)} disabled={savedIds.has(it.id)}
                        className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 disabled:text-green-600 disabled:border-green-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        {savedIds.has(it.id) ? <><Check size={13} /> Saved</> : <><BookmarkPlus size={13} /> Save to library</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "idle" && (
        <div className="text-center py-14 text-slate-400">
          <Library size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Enter a topic above to find research you can read and download.</p>
        </div>
      )}
    </div>
  );
}
