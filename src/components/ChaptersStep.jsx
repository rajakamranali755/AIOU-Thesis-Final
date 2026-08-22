import { useState, useRef } from "react";
import { cleanPasteInto } from "../utils/textNormalize";
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, Table, Image, UploadCloud, X, ZoomIn, Type } from "lucide-react";
import FieldBadge from "./FieldBadge";
import FieldFileUpload from "./FieldFileUpload";
import { useFieldDetection } from "../utils/useFieldDetection";
import { chapterBlocks, blockUid } from "../utils/chapterBlocks";

function InputField({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-blue-900/70 font-semibold uppercase tracking-widest mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        onPaste={e => cleanPasteInto(e, value, onChange, { singleLine: true })}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4, placeholder = "" }) {
  const { aiScore, plagScore, loading, modelGuess } = useFieldDetection(value);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        {label ? (
          <label className="block text-xs text-blue-900/70 font-semibold uppercase tracking-widest">
            {label}
          </label>
        ) : <span />}
        <FieldFileUpload currentValue={value} onText={onChange} />
      </div>
      <textarea
        rows={rows}
        className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 resize-y transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        onPaste={e => cleanPasteInto(e, value, onChange)}
        placeholder={placeholder}
      />
      <FieldBadge aiScore={aiScore} plagScore={plagScore} loading={loading} modelGuess={modelGuess} />
    </div>
  );
}

function SubsectionEditor({ sub, onChange, onRemove }) {
  return (
    <div className="ml-5 mt-2 border-l-2 border-blue-200/40 pl-3">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-slate-9000 font-mono">{sub.number}</span>
        <span className="text-xs text-slate-400">Sub-section</span>
        <button onClick={onRemove} className="ml-auto text-red-7000/60 hover:text-red-600 p-0.5">
          <Trash2 size={11} />
        </button>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <InputField value={sub.number} onChange={v => onChange({ ...sub, number: v })} placeholder="1.1.1" />
          <div className="col-span-2">
            <InputField value={sub.heading} onChange={v => onChange({ ...sub, heading: v })} placeholder="Sub-heading (Title Case)" />
          </div>
        </div>
        <TextArea value={sub.content} onChange={v => onChange({ ...sub, content: v })} rows={3} placeholder="Sub-section content..." />
      </div>
    </div>
  );
}

function SectionEditor({ sec, chapterNo, onChange, onRemove }) {
  const [open, setOpen] = useState(true);

  const addSub = () => {
    const sub = {
      id: Date.now(),
      number: `${sec.number}.${(sec.subsections || []).length + 1}`,
      heading: "",
      content: ""
    };
    onChange({ ...sec, subsections: [...(sec.subsections || []), sub] });
  };

  const updateSub = (idx, upd) => {
    const subs = [...(sec.subsections || [])];
    subs[idx] = upd;
    onChange({ ...sec, subsections: subs });
  };

  const removeSub = (idx) => {
    onChange({ ...sec, subsections: (sec.subsections || []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="border border-slate-200/60 rounded-lg overflow-hidden mb-3">
      <div
        className="flex items-center gap-2 bg-slate-100/80 px-3 py-2 cursor-pointer hover:bg-slate-50"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-mono text-blue-800">{sec.number}</span>
        <span className="text-sm text-slate-700 font-medium flex-1 truncate">
          {sec.heading || "(Untitled Section)"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="text-red-7000/60 hover:text-red-600 p-1"
          >
            <Trash2 size={12} />
          </button>
          {open ? <ChevronUp size={14} className="text-slate-9000" /> : <ChevronDown size={14} className="text-slate-9000" />}
        </div>
      </div>

      {open && (
        <div className="p-3 bg-white space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <InputField value={sec.number} onChange={v => onChange({ ...sec, number: v })} placeholder="1.1" />
            <div className="col-span-3">
              <InputField value={sec.heading} onChange={v => onChange({ ...sec, heading: v })} placeholder="Section Heading (Title Case, no period)" />
            </div>
          </div>
          <TextArea value={sec.content} onChange={v => onChange({ ...sec, content: v })} rows={4} placeholder="Section body text..." />

          {(sec.subsections || []).map((sub, si) => (
            <SubsectionEditor
              key={sub.id}
              sub={sub}
              onChange={upd => updateSub(si, upd)}
              onRemove={() => removeSub(si)}
            />
          ))}

          <button
            onClick={addSub}
            className="flex items-center gap-1 text-xs text-blue-800/70 hover:text-blue-900 px-2 py-1 rounded border border-slate-200 hover:border-blue-600 transition-colors"
          >
            <Plus size={11} /> Add Sub-section
          </button>
        </div>
      )}
    </div>
  );
}

function TableEditor({ table, onChange, onRemove }) {
  const updateHeader = (hi, val) => {
    const headers = [...table.headers];
    headers[hi] = val;
    onChange({ ...table, headers });
  };

  const updateCell = (ri, ci, val) => {
    const rows = table.rows.map((r, rr) =>
      rr === ri ? r.map((c, cc) => cc === ci ? val : c) : r
    );
    onChange({ ...table, rows });
  };

  const addRow = () => onChange({ ...table, rows: [...table.rows, table.headers.map(() => "")] });
  const addCol = () => onChange({
    ...table,
    headers: [...table.headers, `Col ${table.headers.length + 1}`],
    rows: table.rows.map(r => [...r, ""])
  });
  const removeRow = (ri) => onChange({ ...table, rows: table.rows.filter((_, i) => i !== ri) });

  return (
    <div className="border border-slate-200/60 rounded-lg p-3 mb-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-blue-900/70 uppercase tracking-widest">
          Table — Caption Above
        </span>
        <button onClick={onRemove} className="text-red-7000/60 hover:text-red-600 p-1"><Trash2 size={12} /></button>
      </div>
      <input
        className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 mb-2 transition-colors"
        value={table.caption}
        onChange={e => onChange({ ...table, caption: e.target.value })}
        placeholder="Table X.X: Caption placed ABOVE the table, fully justified"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs mb-2">
          <thead>
            <tr>
              {table.headers.map((h, hi) => (
                <th key={hi} className="p-1">
                  <input
                    className="w-full bg-slate-50 border border-blue-200/40 rounded px-1.5 py-1 text-blue-900 font-bold text-xs focus:outline-none focus:border-blue-2000"
                    value={h}
                    onChange={e => updateHeader(hi, e.target.value)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className="group">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-1">
                    <input
                      className="w-full bg-slate-100 border border-slate-200 rounded px-1.5 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-2000"
                      value={cell}
                      onChange={e => updateCell(ri, ci, e.target.value)}
                    />
                  </td>
                ))}
                <td className="p-1 w-6">
                  <button onClick={() => removeRow(ri)} className="text-red-7000/40 hover:text-red-600 opacity-0 group-hover:opacity-100">
                    <Trash2 size={10} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button onClick={addRow} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-1">
          <Plus size={10} /> Row
        </button>
        <button onClick={addCol} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-1">
          <Plus size={10} /> Column
        </button>
      </div>
    </div>
  );
}

function FigureEditor({ figure, onChange, onRemove }) {
  const fileRef = useRef(null);
  const [lightbox, setLightbox] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG, GIF, WEBP, SVG).");
      return;
    }
    // 10 MB cap
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChange({ ...figure, imageData: e.target.result, imageName: file.name });
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const clearImage = (e) => {
    e.stopPropagation();
    onChange({ ...figure, imageData: null, imageName: null });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      {/* Lightbox */}
      {lightbox && figure.imageData && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-slate-50 hover:bg-slate-100 rounded-full p-2"
            onClick={() => setLightbox(false)}
          >
            <X size={18} />
          </button>
          <img
            src={figure.imageData}
            alt={figure.caption || "Figure"}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className="border border-slate-200/60 rounded-xl mb-3 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-100/60 border-b border-slate-200/40">
          <div className="flex items-center gap-2">
            <Image size={13} className="text-blue-800" />
            <span className="text-xs font-bold text-blue-900/80 uppercase tracking-widest">
              Figure — Caption Below
            </span>
          </div>
          <button onClick={onRemove} className="text-red-7000/60 hover:text-red-600 p-1 hover:bg-red-500/10 rounded transition-colors">
            <Trash2 size={12} />
          </button>
        </div>

        <div className="p-3 space-y-3">
          {/* ── Image Upload Zone ── */}
          <div>
            <label className="block text-xs text-blue-900/60 font-bold uppercase tracking-widest mb-1.5">
              Figure Image
            </label>

            {figure.imageData ? (
              /* Preview with controls */
              <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={figure.imageData}
                  alt={figure.caption || "Figure"}
                  className="w-full object-contain max-h-48"
                  style={{ display: "block" }}
                />
                {/* Overlay buttons */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setLightbox(true)}
                    className="bg-slate-100/90 hover:bg-slate-100 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <ZoomIn size={13} /> Preview
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="bg-blue-800/90 hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <UploadCloud size={13} /> Replace
                  </button>
                  <button
                    onClick={clearImage}
                    className="bg-red-700/90 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <X size={13} /> Remove
                  </button>
                </div>
                {/* Filename tag */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-slate-600 px-2 py-1 truncate">
                  {figure.imageName || "Uploaded image"}
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center py-8 gap-2
                  ${dragOver
                    ? "border-blue-2000 bg-blue-600/10 scale-[1.01]"
                    : "border-slate-300 hover:border-blue-600 hover:bg-blue-100/10 bg-slate-100"
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dragOver ? "bg-blue-900" : "bg-slate-50"}`}>
                  <UploadCloud size={20} className={dragOver ? "text-white" : "text-blue-800"} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    {dragOver ? "Drop to upload" : "Click or drag & drop"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    JPG, PNG, GIF, WEBP, SVG — max 10 MB
                  </p>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>

          {/* ── Caption fields ── */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-blue-900/60 font-bold uppercase tracking-widest mb-1">Label</label>
              <input
                className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm font-bold focus:outline-none focus:border-blue-2000 transition-colors"
                value={figure.label}
                onChange={e => onChange({ ...figure, label: e.target.value })}
                placeholder="Figure 1.1:"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-blue-900/60 font-bold uppercase tracking-widest mb-1">Caption Title</label>
              <input
                className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 transition-colors"
                value={figure.caption}
                onChange={e => onChange({ ...figure, caption: e.target.value })}
                placeholder="Short caption title"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-blue-900/60 font-bold uppercase tracking-widest mb-1">
              Description <span className="normal-case font-normal text-slate-400">(normal weight, 11pt)</span>
            </label>
            <input
              className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 transition-colors"
              value={figure.description}
              onChange={e => onChange({ ...figure, description: e.target.value })}
              placeholder="Detailed descriptive text placed after the bold label in the caption"
            />
          </div>
        </div>
      </div>
    </>
  );
}

// Analysed chapter body textarea (needs its own component so hook rules are satisfied)
function ChapterBodyField({ value, onChange }) {
  const { aiScore, plagScore, loading, modelGuess } = useFieldDetection(value);
  return (
    <div>
      <label className="block text-xs text-blue-900/70 font-bold uppercase tracking-widest mb-1">
        Chapter Body Text
      </label>
      <textarea
        rows={6}
        className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm
                   focus:outline-none focus:border-blue-2000 resize-y transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Opening paragraphs before first section heading… (12pt, 1.5 spacing, fully justified)"
      />
      <FieldBadge aiScore={aiScore} plagScore={plagScore} loading={loading} modelGuess={modelGuess} />
    </div>
  );
}

// ── Ordered content blocks (text / figure / table interleaved) ───────────────
function BlocksEditor({ chapter, chIdx, onChange }) {
  const blocks = chapterBlocks(chapter);
  const chNo = chapter.chapterNo || chIdx + 1;
  // Writing to `blocks` supersedes the legacy body/tables/figures fields.
  const commit = (next) => onChange({ ...chapter, blocks: next, body: "", tables: [], figures: [] });
  const updateBlock = (idx, updated) => commit(blocks.map((b, i) => (i === idx ? updated : b)));
  const removeBlock = (idx) => commit(blocks.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    const arr = [...blocks];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    commit(arr);
  };

  const figureCount = blocks.filter((b) => b.type === "figure").length;
  const tableCount = blocks.filter((b) => b.type === "table").length;
  const addText = () => commit([...blocks, { id: blockUid("text"), type: "text", content: "" }]);
  const addFigure = () => commit([...blocks, { id: blockUid("fig"), type: "figure", label: `Figure ${chNo}.${figureCount + 1}:`, caption: "", description: "", imageData: null, imageName: null }]);
  const addTable = () => commit([...blocks, { id: blockUid("tbl"), type: "table", caption: `Table ${chNo}.${tableCount + 1}: `, headers: ["Column 1", "Column 2", "Column 3"], rows: [["", "", ""], ["", "", ""]] }]);

  const AddBtn = ({ onClick, icon: Icon, label }) => (
    <button onClick={onClick}
      className="flex items-center gap-1 text-xs bg-slate-50 hover:bg-slate-100 text-blue-900 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors">
      <Icon size={12} /> {label}
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
          Chapter Content ({blocks.length} block{blocks.length === 1 ? "" : "s"})
        </span>
        <div className="flex gap-1.5">
          <AddBtn onClick={addText} icon={Type} label="Text" />
          <AddBtn onClick={addTable} icon={Table} label="Table" />
          <AddBtn onClick={addFigure} icon={Image} label="Figure" />
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mb-3">
        Add paragraphs, figures and tables in any order — a figure or table sits exactly where you place it in the flow. Use the arrows to reorder.
      </p>

      <div className="space-y-3">
        {blocks.map((b, i) => (
          <div key={b.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {b.type === "text" ? "Paragraph" : b.type}
              </span>
              <div className="flex items-center gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="p-1 text-slate-400 hover:text-blue-700 disabled:opacity-25 disabled:cursor-not-allowed rounded"><ChevronUp size={14} /></button>
                <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1}
                  className="p-1 text-slate-400 hover:text-blue-700 disabled:opacity-25 disabled:cursor-not-allowed rounded"><ChevronDown size={14} /></button>
                {b.type === "text" && (
                  <button onClick={() => removeBlock(i)} className="p-1 text-slate-300 hover:text-red-600 rounded"><Trash2 size={13} /></button>
                )}
              </div>
            </div>

            {b.type === "text" && (
              <TextArea value={b.content} onChange={(v) => updateBlock(i, { ...b, content: v })} rows={4}
                placeholder="Paragraph text…  (leave a blank line to start a new paragraph)" />
            )}
            {b.type === "figure" && (
              <FigureEditor figure={b} onChange={(u) => updateBlock(i, { ...u, type: "figure", id: b.id })} onRemove={() => removeBlock(i)} />
            )}
            {b.type === "table" && (
              <TableEditor table={b} onChange={(u) => updateBlock(i, { ...u, type: "table", id: b.id })} onRemove={() => removeBlock(i)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChapterEditor({ chapter, chIdx, onChange, onRemove }) {
  const [open, setOpen] = useState(chIdx === 0);
  const chNo = String(chapter.chapterNo || chIdx + 1).padStart(2, "0");

  const upd = (key, val) => onChange({ ...chapter, [key]: val });

  const addSection = () => {
    const sec = {
      id: Date.now(),
      number: `${chapter.chapterNo || chIdx + 1}.${(chapter.sections || []).length + 1}`,
      heading: "",
      content: "",
      subsections: []
    };
    upd("sections", [...(chapter.sections || []), sec]);
  };

  const updateSection = (si, updated) => {
    const secs = [...(chapter.sections || [])];
    secs[si] = updated;
    upd("sections", secs);
  };

  const removeSection = (si) => upd("sections", (chapter.sections || []).filter((_, i) => i !== si));

  const addTable = () => {
    const t = {
      id: Date.now(),
      caption: `Table ${chIdx + 1}.${(chapter.tables || []).length + 1}: `,
      headers: ["Column 1", "Column 2", "Column 3"],
      rows: [["", "", ""], ["", "", ""]]
    };
    upd("tables", [...(chapter.tables || []), t]);
  };

  const updateTable = (ti, updated) => {
    const ts = [...(chapter.tables || [])];
    ts[ti] = updated;
    upd("tables", ts);
  };

  const removeTable = (ti) => upd("tables", (chapter.tables || []).filter((_, i) => i !== ti));

  const addFigure = () => {
    const f = {
      id: Date.now(),
      label: `Figure ${chIdx + 1}.${(chapter.figures || []).length + 1}:`,
      caption: "",
      description: "",
      imageData: null,
      imageName: null,
    };
    upd("figures", [...(chapter.figures || []), f]);
  };

  const updateFigure = (fi, updated) => {
    const fs = [...(chapter.figures || [])];
    fs[fi] = updated;
    upd("figures", fs);
  };

  const removeFigure = (fi) => upd("figures", (chapter.figures || []).filter((_, i) => i !== fi));

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
      {/* Chapter Header */}
      <div
        className="flex items-center justify-between bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-blue-800/30 text-blue-900 px-2 py-0.5 rounded font-bold">
            CH {chNo}
          </span>
          <span className="text-sm font-bold text-slate-800 truncate max-w-xs">
            {chapter.title || "(Untitled Chapter)"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400">
            {(() => { const bs = chapterBlocks(chapter); return `${(chapter.sections || []).length}s · ${bs.filter(b => b.type === "table").length}t · ${bs.filter(b => b.type === "figure").length}f`; })()}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="text-red-7000/60 hover:text-red-600 p-1 hover:bg-red-500/10 rounded transition-colors"
          >
            <Trash2 size={13} />
          </button>
          {open ? <ChevronUp size={14} className="text-slate-9000" /> : <ChevronDown size={14} className="text-slate-9000" />}
        </div>
      </div>

      {open && (
        <div className="p-4 bg-white space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-blue-900/70 font-bold uppercase tracking-widest mb-1">No.</label>
              <input
                className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 transition-colors"
                value={chapter.chapterNo}
                onChange={e => upd("chapterNo", e.target.value)}
                placeholder="01"
              />
            </div>
            <div className="col-span-4">
              <label className="block text-xs text-blue-900/70 font-bold uppercase tracking-widest mb-1">Chapter Title</label>
              <input
                className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 transition-colors"
                value={chapter.title}
                onChange={e => upd("title", e.target.value)}
                placeholder="CHAPTER TITLE IN ALL CAPS"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-blue-900/70 font-bold uppercase tracking-widest mb-1">
              Opening Epigraph <span className="text-slate-400 normal-case font-normal">(optional, centered italic)</span>
            </label>
            <input
              className="w-full bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-sm focus:outline-none focus:border-blue-2000 transition-colors"
              value={chapter.epigraph || ""}
              onChange={e => upd("epigraph", e.target.value)}
              placeholder="Quote — Author Name"
            />
          </div>

          <BlocksEditor chapter={chapter} chIdx={chIdx} onChange={onChange} />

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
                Sections ({(chapter.sections || []).length})
              </span>
              <button
                onClick={addSection}
                className="flex items-center gap-1 text-xs bg-slate-50 hover:bg-slate-100 text-blue-900 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                <Plus size={12} /> Add Section
              </button>
            </div>
            {(chapter.sections || []).map((sec, si) => (
              <SectionEditor
                key={sec.id}
                sec={sec}
                chapterNo={chapter.chapterNo}
                onChange={upd => updateSection(si, upd)}
                onRemove={() => removeSection(si)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChaptersStep({ data, onChange }) {
  const addChapter = () => {
    const ch = {
      id: Date.now(),
      chapterNo: String(data.length + 1).padStart(2, "0"),
      title: "",
      epigraph: "",
      blocks: [{ id: blockUid("text"), type: "text", content: "" }],
      body: "",
      sections: [],
      tables: [],
      figures: []
    };
    onChange([...data, ch]);
  };

  const updateChapter = (idx, updated) => {
    const copy = [...data];
    copy[idx] = updated;
    onChange(copy);
  };

  const removeChapter = (idx) => onChange(data.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-800/30 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-blue-800" />
          </div>
          <div>
            <h2 className="text-base font-bold text-blue-950">Chapters</h2>
            <p className="text-xs text-slate-9000">Main body with sections, tables & figures</p>
          </div>
        </div>
        <button
          onClick={addChapter}
          className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow"
        >
          <Plus size={14} /> Add Chapter
        </button>
      </div>

      {data.map((ch, idx) => (
        <ChapterEditor
          key={ch.id}
          chapter={ch}
          chIdx={idx}
          onChange={updated => updateChapter(idx, updated)}
          onRemove={() => removeChapter(idx)}
        />
      ))}

      {data.length === 0 && (
        <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No chapters yet</p>
          <p className="text-xs mt-1">Click "Add Chapter" or load the official sample</p>
        </div>
      )}
    </div>
  );
}
