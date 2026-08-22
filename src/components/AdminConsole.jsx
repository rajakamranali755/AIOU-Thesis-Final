import { useReducer } from "react";
import {
  ShieldCheck, LogOut, Users, UserCheck, UserX, Trash2, MessageSquare,
  MessagesSquare, Megaphone, CheckCircle2, XCircle,
} from "lucide-react";
import * as store from "../utils/scholarStore";

export default function AdminConsole({ onSignOut }) {
  const [, bump] = useReducer(n => n + 1, 0);

  const users = store.getUsers();
  const pendingUsers = users.filter(u => u.status === "pending");
  const members = users.filter(u => u.status !== "pending");
  const discussions = store.getDiscussions();
  const pendingDisc = discussions.filter(d => d.status === "pending");
  const chats = store.getGroupChats();
  const pendingChats = chats.filter(c => c.status === "pending");

  const Stat = ({ label, value }) => (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center">
      <p className="text-2xl font-extrabold text-blue-950">{value}</p>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  );
  const chip = (s) => (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s === "approved" ? "bg-green-100 text-green-700" : s === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>{s}</span>
  );
  const Section = ({ icon: Icon, title, count, children }) => (
    <div>
      <p className="text-xs font-bold text-blue-950 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Icon size={13} /> {title} ({count})</p>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-indigo-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-800 to-indigo-700 flex items-center justify-center shadow"><ShieldCheck size={18} className="text-white" /></div>
          <div>
            <p className="text-sm font-extrabold text-blue-950">Admin Console</p>
            <p className="text-[11px] text-slate-500">Approvals &amp; moderation</p>
          </div>
        </div>
        <button onClick={onSignOut} className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors"><LogOut size={13} /> Sign out</button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="Scholars" value={members.length} />
          <Stat label="Pending users" value={pendingUsers.length} />
          <Stat label="Discussions" value={discussions.length} />
          <Stat label="Pending disc." value={pendingDisc.length} />
          <Stat label="Group chats" value={chats.length} />
        </div>

        {/* Pending user approvals */}
        <Section icon={UserCheck} title="Pending sign-ups" count={pendingUsers.length}>
          {pendingUsers.length === 0 ? <Empty text="No sign-up requests waiting." /> : (
            <div className="space-y-2">
              {pendingUsers.map(u => (
                <Row key={u.id} avatar={u.name.charAt(0)} title={u.name} sub={`${u.email}${u.institution ? " · " + u.institution : ""}`}>
                  <Approve onClick={() => { store.setUserStatus(u.id, "approved"); bump(); }} />
                  <Reject onClick={() => { store.setUserStatus(u.id, "rejected"); bump(); }} />
                </Row>
              ))}
            </div>
          )}
        </Section>

        {/* Pending discussions */}
        <Section icon={Megaphone} title="Discussions awaiting approval" count={pendingDisc.length}>
          {pendingDisc.length === 0 ? <Empty text="No discussions to review." /> : (
            <div className="space-y-2">
              {pendingDisc.map(d => (
                <Row key={d.id} icon={Megaphone} title={d.topic} sub={`Proposed by ${d.author}${d.body ? " · " + d.body.slice(0, 60) : ""}`}>
                  <Approve onClick={() => { store.setDiscussionStatus(d.id, "approved"); bump(); }} label="Publish" />
                  <Reject onClick={() => { store.setDiscussionStatus(d.id, "rejected"); bump(); }} />
                </Row>
              ))}
            </div>
          )}
        </Section>

        {/* Pending group chats */}
        <Section icon={MessagesSquare} title="Group chats awaiting approval" count={pendingChats.length}>
          {pendingChats.length === 0 ? <Empty text="No group-chat requests." /> : (
            <div className="space-y-2">
              {pendingChats.map(c => (
                <Row key={c.id} icon={MessagesSquare} title={c.topic} sub={`Requested by ${c.creator}`}>
                  <Approve onClick={() => { store.setGroupChatStatus(c.id, "approved"); bump(); }} label="Start" />
                  <Reject onClick={() => { store.setGroupChatStatus(c.id, "rejected"); bump(); }} />
                </Row>
              ))}
            </div>
          )}
        </Section>

        {/* Members */}
        <Section icon={Users} title="Members" count={members.length}>
          {members.length === 0 ? <Empty text="No members yet." /> : (
            <div className="space-y-2">
              {members.map(u => (
                <Row key={u.id} avatar={u.name.charAt(0)} title={<span className="flex items-center gap-2">{u.name} {chip(u.status)}</span>} sub={u.email}>
                  {u.status === "rejected" && <button onClick={() => { store.setUserStatus(u.id, "approved"); bump(); }} className="text-xs font-bold text-green-700 hover:text-green-800 px-2 py-1">Approve</button>}
                  <button onClick={() => { if (confirm("Remove this scholar and their data?")) { store.removeUser(u.id); bump(); } }} className="text-slate-300 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                </Row>
              ))}
            </div>
          )}
        </Section>

        {/* Moderate published discussions */}
        <Section icon={MessageSquare} title="Published discussions" count={discussions.filter(d => d.status === "approved").length}>
          {discussions.filter(d => d.status === "approved").length === 0 ? <Empty text="Nothing published yet." /> : (
            <div className="space-y-2">
              {discussions.filter(d => d.status === "approved").map(d => (
                <Row key={d.id} icon={MessageSquare} title={d.topic} sub={`${d.author} · ${d.points.length} point${d.points.length === 1 ? "" : "s"}`}>
                  <button onClick={() => { store.removeDiscussion(d.id); bump(); }} className="text-slate-300 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                </Row>
              ))}
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}

function Empty({ text }) { return <p className="text-sm text-slate-400 italic">{text}</p>; }

function Row({ avatar, icon: Icon, title, sub, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
      {avatar ? (
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-600 text-white flex items-center justify-center font-extrabold shrink-0 uppercase">{avatar}</div>
      ) : Icon ? (
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0"><Icon size={16} className="text-blue-800" /></div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{sub}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}
function Approve({ onClick, label = "Approve" }) {
  return <button onClick={onClick} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"><CheckCircle2 size={12} /> {label}</button>;
}
function Reject({ onClick }) {
  return <button onClick={onClick} className="flex items-center gap-1 bg-white border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg"><XCircle size={12} /> Reject</button>;
}
