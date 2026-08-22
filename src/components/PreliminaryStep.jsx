import { BookMarked } from "lucide-react";
import { cleanPasteInto } from "../utils/textNormalize";
import FieldBadge from "./FieldBadge";
import FieldFileUpload from "./FieldFileUpload";
import { useFieldDetection } from "../utils/useFieldDetection";
import { aiouPhdPageTexts } from "../utils/aiouPhdPages";

function AnalysedTextarea({ label, hint, value, onChange, rows = 6 }) {
  const { aiScore, plagScore, loading, modelGuess } = useFieldDetection(value);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label className="text-xs font-bold text-blue-900 uppercase tracking-widest">{label}</label>
        <div className="flex items-center gap-3 shrink-0">
          {hint && <span className="text-xs text-slate-400">{hint}</span>}
          <FieldFileUpload currentValue={value} onText={onChange} />
        </div>
      </div>
      <textarea
        rows={rows}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm
                   focus:outline-none focus:border-blue-2000 focus:ring-1 focus:ring-blue-2000/30 resize-y transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        onPaste={e => cleanPasteInto(e, value, onChange)}
      />
      <FieldBadge aiScore={aiScore} plagScore={plagScore} loading={loading} modelGuess={modelGuess} />
    </div>
  );
}

function FMText({ label, value, onChange, ph }) {
  return (
    <div>
      <label className="block text-xs font-bold text-blue-900 uppercase tracking-widest mb-1.5">{label}</label>
      <input value={value || ""} placeholder={ph} onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/30" />
    </div>
  );
}
// Editor for an AIOU PhD template page — the same textarea every other page
// uses. The text is pre-filled with the official wording (auto-filled from the
// Cover step); the page is rebuilt from whatever is written here, and clearing
// the text removes the page.
function PageTextarea({ label, hint, value, onChange, onReset, edited, rows = 5 }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label className="text-xs font-bold text-blue-900 uppercase tracking-widest">{label}</label>
        <div className="flex items-center gap-3 shrink-0">
          {hint && <span className="text-xs text-slate-400">{hint}</span>}
          {edited && (
            <button type="button" onClick={onReset} className="text-xs font-bold text-sky-700 hover:text-sky-900">
              Reset to template wording
            </button>
          )}
        </div>
      </div>
      <textarea
        rows={rows}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm
                   focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/30 resize-y transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        onPaste={e => cleanPasteInto(e, value, onChange)}
      />
    </div>
  );
}

function FMToggle({ checked, label, hint, onChange }) {
  return (
    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-700 shrink-0" />
      <span className="text-sm">
        <span className="font-bold text-blue-950">{label}</span>
        {hint && <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

export default function PreliminaryStep({ data, onChange, templateId, cover = {} }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });
  const isAIOU = templateId === "aiou";
  const want = (v) => v !== false; // AIOU front-matter toggles default ON

  const abbrs = data.abbreviations || [];
  const setAbbr = (i, field, v) => { const next = abbrs.map((a, j) => j === i ? { ...a, [field]: v } : a); upd("abbreviations", next); };
  const addAbbr = () => upd("abbreviations", [...abbrs, { abbr: "", full: "" }]);
  const delAbbr = (i) => upd("abbreviations", abbrs.filter((_, j) => j !== i));
  const approval = data.approval || {};
  const setApproval = (field, v) => upd("approval", { ...approval, [field]: v });

  // ── AIOU PhD template pages (Appendix E & G of the PhD_New_Template) ──
  // Created exactly like every other page: each page is its editable text,
  // pre-filled with the official wording (auto-filled from the Cover step).
  // Editing the text rewrites the page; clearing the text removes the page.
  const phd = aiouPhdPageTexts(data, cover);
  const phdEdited = (key) => data[key] !== undefined && data[key] !== null;
  const phdReset = (key) => { const next = { ...data }; delete next[key]; onChange(next); };
  const vv = data.vivaVoce || {};
  const setVV = (field, v) => upd("vivaVoce", { ...vv, [field]: v });

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-blue-800/30 rounded-lg flex items-center justify-center">
          <BookMarked size={16} className="text-blue-800" />
        </div>
        <div>
          <h2 className="text-base font-bold text-blue-950">Preliminary Pages</h2>
          <p className="text-xs text-slate-9000">Pre-chapter content</p>
        </div>
      </div>
      <div className="space-y-6">
        <AnalysedTextarea label="Abstract"        hint="12pt · 1.5 spacing"       value={data.abstract}        onChange={v => upd("abstract", v)}        rows={8} />
        <AnalysedTextarea label="Acknowledgement" hint="Signature right-justified" value={data.acknowledgement} onChange={v => upd("acknowledgement", v)} rows={6} />
        <AnalysedTextarea label="Dedication"      hint="Centered, brief"           value={data.dedication}      onChange={v => upd("dedication", v)}      rows={2} />
        {!isAIOU && (
          <AnalysedTextarea label="Declaration"     hint="Signed statement"          value={data.declaration}     onChange={v => upd("declaration", v)}     rows={6} />
        )}

        <FMToggle checked={isAIOU ? want(data.includeToc) : !!data.includeToc} onChange={v => upd("includeToc", v)} label="Automatic Table of Contents" hint="Builds a contents page from your chapters and sections (with page numbers), inserted before the chapters. Updates automatically." />

        {isAIOU && (
          <div className="space-y-4 p-4 rounded-xl border border-sky-200 bg-sky-50/60">
            <p className="text-xs font-bold text-sky-800 uppercase tracking-widest">AIOU Front Matter</p>

            <FMToggle checked={want(data.includeApproval)} onChange={v => upd("includeApproval", v)} label="Approval Sheet (Viva Voce Committee)" hint="Signature lines for Chairperson, External & Internal Examiner. Names optional." />
            {want(data.includeApproval) && (
              <div className="grid sm:grid-cols-3 gap-3 pl-1">
                <FMText label="Chairperson" value={approval.chairperson} onChange={v => setApproval("chairperson", v)} ph="(optional)" />
                <FMText label="External Examiner" value={approval.externalExaminer} onChange={v => setApproval("externalExaminer", v)} ph="(optional)" />
                <FMText label="Internal Examiner" value={approval.internalExaminer} onChange={v => setApproval("internalExaminer", v)} ph="(optional)" />
              </div>
            )}

            <FMToggle checked={want(data.includeForwarding)} onChange={v => upd("includeForwarding", v)} label="Forwarding Certificate" hint="Supervisor's certificate referencing your title. Uses the supervisor name from the Cover step unless set below." />
            {want(data.includeForwarding) && (
              <div className="grid sm:grid-cols-2 gap-3 pl-1">
                <FMText label="Supervisor name" value={data.supervisorName} onChange={v => upd("supervisorName", v)} ph={cover.supervisor || "Prof. Dr. …"} />
                <FMText label="Designation" value={data.supervisorDesignation} onChange={v => upd("supervisorDesignation", v)} ph={cover.supervisorDesignation || "e.g. Vice Chancellor …"} />
                <FMText label="Qualifications" value={data.supervisorQualifications} onChange={v => upd("supervisorQualifications", v)} ph="e.g. PhD Civil Engineering" />
                <FMText label="Institution" value={data.supervisorInstitution} onChange={v => upd("supervisorInstitution", v)} ph="e.g. Karakoram International University" />
              </div>
            )}

            <FMToggle checked={want(data.includeListOfTables)}  onChange={v => upd("includeListOfTables", v)}  label="List of Tables"  hint="Auto-built from tables you add (with captions) in the chapters." />
            <FMToggle checked={want(data.includeListOfFigures)} onChange={v => upd("includeListOfFigures", v)} label="List of Figures" hint="Auto-built from figures you add (with captions) in the chapters." />

            <FMToggle checked={want(data.includeAbbreviations)} onChange={v => upd("includeAbbreviations", v)} label="Abbreviations and Acronym" hint="A two-column list of abbreviations and their meanings." />
            {want(data.includeAbbreviations) && (
              <div className="pl-1 space-y-2">
                {abbrs.map((a, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={a.abbr || ""} placeholder="AIOU" onChange={e => setAbbr(i, "abbr", e.target.value)}
                      className="w-32 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-700" />
                    <input value={a.full || ""} placeholder="Allama Iqbal Open University" onChange={e => setAbbr(i, "full", e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-700" />
                    <button type="button" onClick={() => delAbbr(i)} className="text-slate-400 hover:text-red-500 text-lg px-1 leading-none">×</button>
                  </div>
                ))}
                <button type="button" onClick={addAbbr} className="text-xs font-bold text-sky-700 hover:text-sky-900">+ Add abbreviation</button>
              </div>
            )}
          </div>
        )}

        {isAIOU && (
          <>
            <p className="text-xs text-slate-500 -mb-2">
              AIOU PhD template pages (Appendix E &amp; G) — written for you with the official wording and your Cover details. Edit them like any other page; clearing a page&apos;s text removes it.
            </p>

            <PageTextarea label="Inner Title Page (AIOU E-II)" hint="Title, scholar & emblem come from the Cover step" rows={5}
              value={phd.innerTitle} onChange={v => upd("innerTitleText", v)}
              edited={phdEdited("innerTitleText")} onReset={() => phdReset("innerTitleText")} />

            <PageTextarea label={'"In the Name of Allah" Page (AIOU E-III)'} hint="Its own page, centered" rows={2}
              value={phd.bismillah} onChange={v => upd("bismillahText", v)}
              edited={phdEdited("bismillahText")} onReset={() => phdReset("bismillahText")} />

            <PageTextarea label="Acceptance by the Viva Voce Committee (AIOU E-IV)" hint="Names below are optional — blanks print as signature lines" rows={4}
              value={phd.vivaVoce} onChange={v => upd("vivaVoceText", v)}
              edited={phdEdited("vivaVoceText")} onReset={() => phdReset("vivaVoceText")} />
            <div className="grid sm:grid-cols-3 gap-3">
              <FMText label="Department" value={vv.department} onChange={v => setVV("department", v)} ph={cover.department || "(optional)"} />
              <FMText label="Supervisor" value={vv.supervisor} onChange={v => setVV("supervisor", v)} ph={cover.supervisor || "(optional)"} />
              <FMText label="External Examiner" value={vv.externalExaminer} onChange={v => setVV("externalExaminer", v)} ph="(optional)" />
              <FMText label="Internal Examiner" value={vv.internalExaminer} onChange={v => setVV("internalExaminer", v)} ph="(optional)" />
              <FMText label="Chairperson / Director" value={vv.chairperson} onChange={v => setVV("chairperson", v)} ph="(optional)" />
              <FMText label="Dean" value={vv.dean} onChange={v => setVV("dean", v)} ph="(optional)" />
              <FMText label="Member 1" value={vv.member1} onChange={v => setVV("member1", v)} ph="(optional)" />
              <FMText label="Member 2" value={vv.member2} onChange={v => setVV("member2", v)} ph="(optional)" />
              <FMText label="Date (Day, Month, Year)" value={vv.date} onChange={v => setVV("date", v)} ph="e.g. 21 August, 2026" />
            </div>

            <PageTextarea label="Declaration by the Student (AIOU G-a)" hint="Fill the blanks right in the text" rows={6}
              value={phd.studentDeclaration} onChange={v => upd("studentDeclarationText", v)}
              edited={phdEdited("studentDeclarationText")} onReset={() => phdReset("studentDeclarationText")} />

            <PageTextarea label="Plagiarism Undertaking (AIOU G-b)" hint="One paragraph per line" rows={7}
              value={phd.plagiarism} onChange={v => upd("plagiarismText", v)}
              edited={phdEdited("plagiarismText")} onReset={() => phdReset("plagiarismText")} />
          </>
        )}
      </div>
      <div className="mt-6 p-3 bg-white rounded-lg border border-slate-200">
        <p className="text-xs text-slate-9000">
          {isAIOU
            ? <><span className="text-blue-800 font-bold">AIOU format:</span> Front matter is numbered with roman numerals (ii, iii…) at the bottom-centre; chapters restart at arabic 1. Headings are bold ALL-CAPS in black.</>
            : <><span className="text-blue-800 font-bold">Format Note:</span> Preliminary titles are centered, bold, ALL CAPS, 12pt. Body 11pt normal. Signature blocks right-justified. Pages numbered (i), (ii)…</>}
        </p>
      </div>
    </div>
  );
}
