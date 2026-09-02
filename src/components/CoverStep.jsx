import { useRef } from "react";
import { cleanPasteInto } from "../utils/textNormalize";
import { GraduationCap, UploadCloud, X, ImageIcon } from "lucide-react";

function LogoUploader({ value, name, onUpload, onClear }) {
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, SVG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onUpload(e.target.result, file.name);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-blue-900 uppercase tracking-widest mb-1.5">
        University Logo / Emblem (PNG)
      </label>

      {value ? (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
          <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
            <img src={value} alt="University logo" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-700 truncate">{name || "Uploaded logo"}</p>
            <p className="text-xs text-slate-400 mt-0.5">Appears on the cover / first page.</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors">
                <UploadCloud size={12} /> Replace
              </button>
              <button onClick={() => { onClear(); if (fileRef.current) fileRef.current.value = ""; }}
                className="flex items-center gap-1 bg-white border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors">
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-600 hover:bg-blue-100/10 bg-slate-50 transition-all flex flex-col items-center justify-center py-6 gap-2">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <ImageIcon size={18} className="text-blue-800" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">Click to upload your university logo</p>
            <p className="text-xs text-slate-400 mt-0.5">PNG (transparent recommended), JPG or SVG — max 5 MB</p>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", rows = 3 }) {
  const base =
    "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 focus:ring-1 focus:ring-blue-2000/30 transition-colors";
  return (
    <div>
      <label className="block text-xs font-bold text-blue-900 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          rows={rows}
          className={base + " resize-none"}
          value={value}
          onChange={e => onChange(e.target.value)}
          onPaste={e => cleanPasteInto(e, value, onChange, { singleLine: true })}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          className={base}
          value={value}
          onChange={e => onChange(e.target.value)}
          onPaste={e => cleanPasteInto(e, value, onChange, { singleLine: true })}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

export default function CoverStep({ data, onChange }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-blue-800/30 rounded-lg flex items-center justify-center">
          <GraduationCap size={16} className="text-blue-800" />
        </div>
        <div>
          <h2 className="text-base font-bold text-blue-950">Cover Page</h2>
          <p className="text-xs text-slate-9000">Title page details for your thesis</p>
        </div>
      </div>

      <div className="space-y-4">
        <LogoUploader
          value={data.logo}
          name={data.logoName}
          onUpload={(dataUrl, fname) => onChange({ ...data, logo: dataUrl, logoName: fname })}
          onClear={() => onChange({ ...data, logo: null, logoName: null })}
        />

        <Field
          label="Thesis Title"
          value={data.title}
          onChange={v => upd("title", v)}
          type="textarea"
          rows={3}
          placeholder="FULL THESIS TITLE IN CAPITALS..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Author Full Name"
            value={data.authorName}
            onChange={v => upd("authorName", v)}
            placeholder="e.g. UZMA ASMAT"
          />
          <Field
            label="Registration Number"
            value={data.registrationNo}
            onChange={v => upd("registrationNo", v)}
            placeholder="e.g. 18035202190"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field
              label="Degree Full Name"
              value={data.degree}
              onChange={v => upd("degree", v)}
              placeholder="Doctor of Philosophy"
            />
          </div>
          <Field
            label="Abbreviation"
            value={data.degreeAbbr}
            onChange={v => upd("degreeAbbr", v)}
            placeholder="PhD"
          />
        </div>

        <Field
          label="Subject / Discipline"
          value={data.subject}
          onChange={v => upd("subject", v)}
          placeholder="e.g. English"
        />

        <Field
          label="Department"
          value={data.department}
          onChange={v => upd("department", v)}
          placeholder="Department of English"
        />

        <Field
          label="Faculty"
          value={data.faculty}
          onChange={v => upd("faculty", v)}
          placeholder="Faculty of Arts"
        />

        <Field
          label="University Name"
          value={data.university}
          onChange={v => upd("university", v)}
          placeholder="UNIVERSITY OF GUJRAT"
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Session / Year"
            value={data.session}
            onChange={v => upd("session", v)}
            placeholder="2018-22"
          />
        </div>

        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-3">
            Supervisor Details
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Supervisor Name"
              value={data.supervisor}
              onChange={v => upd("supervisor", v)}
              placeholder="Dr. Kanwal Zahra"
            />
            <Field
              label="Designation"
              value={data.supervisorDesignation}
              onChange={v => upd("supervisorDesignation", v)}
              placeholder="Associate Professor"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
