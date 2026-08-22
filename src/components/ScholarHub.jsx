import { useState, useEffect, useReducer } from "react";
import {
  User, Library, MessageSquare, Calendar, Plus, Trash2, Send,
  Building2, Clock, ExternalLink, BookOpen, FileText, FileSignature,
  MessagesSquare, Megaphone, FolderOpen, CheckCircle2,
} from "lucide-react";
import * as store from "../utils/scholarStore";

/**
 * ScholarHub — the signed-in scholar's workspace (auth is handled globally at
 * app start, not here). Tabs: Profile · My Library · Discussions · Group Chats ·
 * Meetings. `onLoadProject` loads a saved thesis/article back into the builder.
 */
const TABS = [
  { id: "profile",     label: "Profile",     icon: User },
  { id: "library",     label: "My Library",  icon: Library },
  { id: "discussions", label: "Discussions", icon: Megaphone },
  { id: "chats",       label: "Group Chats", icon: MessagesSquare },
  { id: "meetings",    label: "Meetings",    icon: Calendar },
];

export default function ScholarHub({ user, tab = "profile", onLoadProject = () => {} }) {
  if (!user) return null;
  const meta = TABS.find(t => t.id === tab) || TABS[0];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-800 to-indigo-700 flex items-center justify-center shadow">
            <meta.icon size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-blue-950 leading-tight">{meta.label}</h2>
            <p className="text-xs text-slate-500">Scholar Hub · {user.name}</p>
          </div>
        </div>

        {tab === "profile"     && <ProfileTab user={user} />}
        {tab === "library"     && <LibraryTab user={user} onLoadProject={onLoadProject} />}
        {tab === "discussions" && <DiscussionsTab user={user} />}
        {tab === "chats"       && <GroupChatsTab user={user} />}
        {tab === "meetings"    && <MeetingsTab user={user} />}
      </div>
    </div>
  );
}

/* ── Profile ── */
function ProfileTab({ user }) {
  const [p, setP] = useState({ name: user.name, field: user.field, institution: user.institution, bio: user.bio || "" });
  const [saved, setSaved] = useState(false);
  const up = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const onSave = () => { store.updateCurrentUser(p); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shadow">{(p.name || "S").trim().charAt(0).toUpperCase()}</div>
        <div><p className="text-base font-bold text-blue-950">{p.name}</p><p className="text-xs text-slate-500">{user.email}</p></div>
      </div>
      {[["Full name", "name", "Your name"], ["Field / Discipline", "field", "e.g. Computer Science"], ["Institution", "institution", "e.g. University of the Punjab"]].map(([label, k, ph]) => (
        <div key={k}>
          <label className="block text-xs font-bold text-blue-900 uppercase tracking-widest mb-1.5">{label}</label>
          <input value={p[k]} onChange={e => up(k, e.target.value)} placeholder={ph} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600" />
        </div>
      ))}
      <div>
        <label className="block text-xs font-bold text-blue-900 uppercase tracking-widest mb-1.5">Research interests / bio</label>
        <textarea rows={4} value={p.bio} onChange={e => up("bio", e.target.value)} placeholder="A short description of your research focus…" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 resize-y" />
      </div>
      <button onClick={onSave} className="bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-900 hover:to-indigo-800 text-white text-sm font-bold px-5 py-2 rounded-lg shadow transition-colors">{saved ? "Saved ✓" : "Save profile"}</button>
    </div>
  );
}

/* ── My Library: built/uploaded projects + saved papers ── */
function LibraryTab({ user, onLoadProject }) {
  const [projects, setProjects] = useState(() => store.getProjects(user.id));
  const [papers, setPapers] = useState(() => store.getLibrary(user.id));
  const [form, setForm] = useState({ title: "", authors: "", year: "", link: "" });

  useEffect(() => store.saveLibrary(user.id, papers), [papers, user.id]);
  useEffect(() => {
    const h = () => { setPapers(store.getLibrary(user.id)); setProjects(store.getProjects(user.id)); };
    window.addEventListener("scholarhub-library-changed", h);
    return () => window.removeEventListener("scholarhub-library-changed", h);
  }, [user.id]);

  const delProject = (id) => setProjects(store.removeProject(user.id, id));
  const addPaper = () => { if (!form.title.trim()) return; setPapers(prev => [{ id: Date.now(), ...form }, ...prev]); setForm({ title: "", authors: "", year: "", link: "" }); };
  const delPaper = (id) => setPapers(prev => prev.filter(i => i.id !== id));

  return (
    <div className="space-y-8">
      {/* Projects */}
      <div>
        <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FolderOpen size={13} /> My theses &amp; articles ({projects.length})</p>
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-400">
            Use <span className="font-semibold text-blue-700">Save to Library</span> in the top bar to store your current thesis or article here.
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                  {p.type === "article" ? <FileText size={16} className="text-indigo-700" /> : <FileSignature size={16} className="text-blue-800" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 leading-snug">{p.title || "Untitled"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.type === "article" ? "Article" : "Thesis"} · saved {new Date(p.savedAt).toLocaleDateString()}</p>
                  <button onClick={() => onLoadProject(p)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 mt-2"><FolderOpen size={12} /> Open in builder</button>
                </div>
                <button onClick={() => delProject(p.id)} className="text-slate-300 hover:text-red-600 p-1 shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved papers */}
      <div>
        <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-3 flex items-center gap-1.5"><BookOpen size={13} /> Saved papers ({papers.length})</p>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title *" className="sm:col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
            <input value={form.authors} onChange={e => setForm({ ...form, authors: e.target.value })} placeholder="Authors" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
            <input value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="Year" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
            <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="Link / DOI" className="sm:col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <button onClick={addPaper} className="mt-3 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Save paper</button>
        </div>
        {papers.length === 0 ? <p className="text-sm text-slate-400 italic">No saved papers yet — save them from Find Theses.</p> : (
          <div className="space-y-3">
            {papers.map(it => (
              <div key={it.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0"><BookOpen size={16} className="text-blue-800" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 leading-snug">{it.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{[it.authors, it.year].filter(Boolean).join(" · ")}</p>
                  {it.link && <a href={it.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 mt-2"><ExternalLink size={12} /> Open</a>}
                </div>
                <button onClick={() => delPaper(it.id)} className="text-slate-300 hover:text-red-600 p-1 shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Discussions: propose (pending) + contribute points to approved ── */
function DiscussionsTab({ user }) {
  const [, bump] = useReducer(n => n + 1, 0);
  const [form, setForm] = useState({ topic: "", body: "" });
  const [point, setPoint] = useState({});
  const all = store.getDiscussions();
  const approved = all.filter(d => d.status === "approved");
  const mine = all.filter(d => d.authorId === user.id && d.status !== "approved");

  const propose = () => { if (!form.topic.trim()) return; store.proposeDiscussion(form, user); setForm({ topic: "", body: "" }); bump(); };
  const addPoint = (id) => { const t = (point[id] || "").trim(); if (!t) return; store.addDiscussionPoint(id, t, user); setPoint(p => ({ ...p, [id]: "" })); bump(); };

  return (
    <div>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
        <p className="text-sm font-bold text-blue-950 mb-1 flex items-center gap-1.5"><Plus size={14} /> Start a discussion</p>
        <p className="text-xs text-slate-500 mb-3">Once an admin approves it, your topic appears on the public landing page where everyone can add points.</p>
        <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="Discussion topic *" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-blue-600" />
        <textarea rows={2} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Opening point (optional)…" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:border-blue-600" />
        <button onClick={propose} className="mt-3 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-4 py-2 rounded-lg">Submit for approval</button>
      </div>

      {mine.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Your submissions</p>
          {mine.map(d => (
            <div key={d.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1.5">
              <Megaphone size={13} className="text-amber-500 shrink-0" />
              <span className="text-sm text-slate-700 flex-1 truncate">{d.topic}</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase">{d.status}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-3">Active discussions ({approved.length})</p>
      {approved.length === 0 ? <p className="text-sm text-slate-400 italic">No approved discussions yet.</p> : (
        <div className="space-y-3">
          {approved.map(d => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-800">{d.topic}</p>
              <p className="text-xs text-slate-400 mb-2">Started by {d.author}</p>
              <div className="space-y-1.5 mb-2">
                {d.points.map(pt => (
                  <div key={pt.id} className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5"><span className="font-bold text-blue-800">{pt.author}:</span> {pt.text}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={point[d.id] || ""} onChange={e => setPoint(p => ({ ...p, [d.id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addPoint(d.id)} placeholder="Add your point…" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-600" />
                <button onClick={() => addPoint(d.id)} className="bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Post</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Group chats: request (pending) + message approved chats ── */
function GroupChatsTab({ user }) {
  const [, bump] = useReducer(n => n + 1, 0);
  const [topic, setTopic] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [msg, setMsg] = useState("");
  const all = store.getGroupChats();
  const approved = all.filter(c => c.status === "approved");
  const mine = all.filter(c => c.creatorId === user.id && c.status !== "approved");

  const request = () => { if (!topic.trim()) return; store.proposeGroupChat({ topic }, user); setTopic(""); bump(); };
  const send = () => { const t = msg.trim(); if (!t) return; store.addGroupMessage(activeId, t, user); setMsg(""); bump(); };
  const active = approved.find(c => c.id === activeId);

  if (active) {
    return (
      <div>
        <button onClick={() => setActiveId(null)} className="text-xs font-bold text-blue-700 hover:text-blue-900 mb-3">← All group chats</button>
        <h3 className="text-base font-bold text-blue-950">{active.topic}</h3>
        <p className="text-xs text-slate-400 mb-4">Group chat · started by {active.creator}</p>
        <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
          {active.messages.length === 0 && <p className="text-sm text-slate-400 italic">No messages yet — say hello.</p>}
          {active.messages.map(m => (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.authorId === user.id ? "ml-auto bg-gradient-to-r from-blue-800 to-indigo-700 text-white" : "bg-slate-100 text-slate-700"}`}>
              <p className={`text-[10px] font-bold ${m.authorId === user.id ? "text-blue-100" : "text-blue-800"}`}>{m.author}</p>
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Message…" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
          <button onClick={send} className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 text-white text-sm font-bold px-4 py-2 rounded-lg"><Send size={14} /> Send</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
        <p className="text-sm font-bold text-blue-950 mb-1 flex items-center gap-1.5"><Plus size={14} /> Create a group chat</p>
        <p className="text-xs text-slate-500 mb-3">An admin approves it before the chat goes live. Group chats are private to members — they never appear on the landing page.</p>
        <div className="flex gap-2">
          <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && request()} placeholder="Chat topic, e.g. ‘NLP thesis group’ *" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
          <button onClick={request} className="bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0">Request</button>
        </div>
      </div>

      {mine.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Your requests</p>
          {mine.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1.5">
              <MessagesSquare size={13} className="text-amber-500 shrink-0" />
              <span className="text-sm text-slate-700 flex-1 truncate">{c.topic}</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase">{c.status}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-3">Active group chats ({approved.length})</p>
      {approved.length === 0 ? <p className="text-sm text-slate-400 italic">No group chats yet.</p> : (
        <div className="space-y-3">
          {approved.map(c => (
            <div key={c.id} onClick={() => setActiveId(c.id)} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0"><MessagesSquare size={16} className="text-blue-800" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{c.topic}</p>
                <p className="text-xs text-slate-400">{c.messages.length} message{c.messages.length === 1 ? "" : "s"} · by {c.creator}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Meetings (per-user) ── */
function MeetingsTab({ user }) {
  const [meetings, setMeetings] = useState(() => store.getMeetings(user.id));
  const [form, setForm] = useState({ title: "", date: "", time: "", with: "", notes: "" });
  useEffect(() => store.saveMeetings(user.id, meetings), [meetings, user.id]);

  const add = () => { if (!form.title.trim() || !form.date) return; setMeetings(prev => [...prev, { id: Date.now(), ...form }].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))); setForm({ title: "", date: "", time: "", with: "", notes: "" }); };
  const remove = (id) => setMeetings(prev => prev.filter(m => m.id !== id));
  const isPast = (m) => new Date(`${m.date}T${m.time || "23:59"}`) < new Date();

  return (
    <div>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
        <p className="text-sm font-bold text-blue-950 mb-3 flex items-center gap-1.5"><Plus size={14} /> Schedule a meeting</p>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Meeting title *" className="sm:col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
          <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
          <input value={form.with} onChange={e => setForm({ ...form, with: e.target.value })} placeholder="With (supervisor, group…)" className="sm:col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
          <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Agenda / notes" className="sm:col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:border-blue-600" />
        </div>
        <button onClick={add} className="mt-3 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-4 py-2 rounded-lg">Add meeting</button>
      </div>
      {meetings.length === 0 ? <div className="text-center py-12 text-slate-400"><Calendar size={36} className="mx-auto mb-3 opacity-20" /><p className="text-sm">No meetings scheduled.</p></div> : (
        <div className="space-y-3">
          {meetings.map(m => (
            <div key={m.id} className={`border rounded-xl p-4 flex items-start gap-3 ${isPast(m) ? "bg-slate-50 border-slate-200 opacity-70" : "bg-white border-slate-200 hover:border-blue-300"} transition-colors`}>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-800 to-indigo-700 text-white flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold uppercase">{m.date ? new Date(m.date).toLocaleString("en", { month: "short" }) : "—"}</span>
                <span className="text-base font-extrabold leading-none">{m.date ? new Date(m.date).getDate() : "?"}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{m.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={11} /> {m.time || "—"}</span>
                  {m.with && <span className="flex items-center gap-1"><Building2 size={11} /> {m.with}</span>}
                </p>
                {m.notes && <p className="text-xs text-slate-500 mt-1.5">{m.notes}</p>}
              </div>
              <button onClick={() => remove(m.id)} className="text-slate-300 hover:text-red-600 p-1 shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
