import { useState } from "react";
import {
  User, Lock, Mail, BookOpen, Building2, GraduationCap,
  CheckCircle2, AlertCircle, ArrowLeft,
} from "lucide-react";
import * as store from "../utils/scholarStore";

/* Stable, module-level field so the input keeps focus while typing. */
function Field({ icon: Icon, label, value, onChange, onEnter, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-xs font-bold text-blue-900 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
        />
      </div>
    </div>
  );
}

/**
 * AuthScreen — the app's entry gate. Users must create an account (then be
 * approved by the admin) and sign in before the builder & features unlock.
 */
export default function AuthScreen({ onAuthed, onBack }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "", field: "", institution: "" });
  const [msg, setMsg] = useState(null);
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    setMsg(null);
    if (mode === "signup") {
      const r = store.signUp(form);
      if (r.error) return setMsg({ type: "error", text: r.error });
      setMsg({ type: "ok", text: "Account requested! An admin must approve it before you can sign in." });
      setMode("signin");
      setForm(f => ({ ...f, password: "" }));
    } else {
      const r = store.signIn({ email: form.email, password: form.password });
      if (r.error) return setMsg({ type: "error", text: r.error });
      onAuthed();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-5 py-10">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-800">
          <ArrowLeft size={14} /> Back to home
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-7">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-800 to-indigo-700 flex items-center justify-center shadow mb-3">
              <GraduationCap size={26} className="text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-blue-950">Academic Writing Suite</h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === "signin" ? "Sign in to access the builder & your workspace" : "Create your account to get started"}
            </p>
          </div>

          <div className="flex gap-1 bg-gradient-to-r from-blue-50 to-indigo-100 border border-indigo-200 rounded-xl p-1 mb-5">
            {[["signin", "Sign In"], ["signup", "Create Account"]].map(([id, label]) => (
              <button key={id} onClick={() => { setMode(id); setMsg(null); }}
                className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${mode === id ? "bg-gradient-to-r from-blue-800 to-indigo-700 text-white shadow" : "text-slate-600 hover:text-blue-800"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {mode === "signup" && <Field icon={User} label="Full name" value={form.name} onChange={e => up("name", e.target.value)} onEnter={submit} placeholder="Dr. Ayesha Khan" />}
            <Field icon={Mail} label="Email" type="email" value={form.email} onChange={e => up("email", e.target.value)} onEnter={submit} placeholder="you@university.edu" />
            <Field icon={Lock} label="Password" type="password" value={form.password} onChange={e => up("password", e.target.value)} onEnter={submit} placeholder="••••••••" />
            {mode === "signup" && <>
              <Field icon={BookOpen} label="Field" value={form.field} onChange={e => up("field", e.target.value)} onEnter={submit} placeholder="Computer Science" />
              <Field icon={Building2} label="Institution" value={form.institution} onChange={e => up("institution", e.target.value)} onEnter={submit} placeholder="University of the Punjab" />
            </>}
          </div>

          {msg && (
            <div className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${msg.type === "ok" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {msg.type === "ok" ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
              <span>{msg.text}</span>
            </div>
          )}

          <button onClick={submit}
            className="mt-5 w-full bg-gradient-to-r from-blue-800 to-indigo-700 hover:from-blue-900 hover:to-indigo-800 text-white text-sm font-bold py-2.5 rounded-xl shadow transition-colors">
            {mode === "signin" ? "Sign in" : "Request account"}
          </button>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
            <p className="font-bold text-slate-600 mb-1">Demo logins (temporary)</p>
            <p>Scholar — <span className="font-mono text-slate-700">{store.DEMO.email}</span> / <span className="font-mono text-slate-700">{store.DEMO.password}</span></p>
            <p>Admin — <span className="font-mono text-slate-700">{store.ADMIN.email}</span> / <span className="font-mono text-slate-700">{store.ADMIN.password}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
