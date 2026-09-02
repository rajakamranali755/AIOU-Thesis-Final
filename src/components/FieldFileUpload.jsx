import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { readFieldFile } from "../utils/fieldFileImport";

/**
 * Small "Upload .txt / .docx" control attached to a text field.
 *
 * Behaviour: an empty field is filled with the file's text; a field that
 * already has content gets the imported text appended after a blank line, so
 * nothing the user has typed is ever silently overwritten.
 *
 * Props:
 *   currentValue – the field's current text (used to decide fill vs append)
 *   onText(text) – called with the new field value
 *   label        – optional button label
 */
export default function FieldFileUpload({ currentValue = "", onText, label = "Upload .txt / .docx" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = () => { setErr(""); inputRef.current?.click(); };

  const handle = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";          // allow re-selecting the same file later
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const text = await readFieldFile(file);
      if (!text) { setErr("That file looks empty."); return; }
      const base = (currentValue || "").trim();
      onText(base ? `${base}\n\n${text}` : text);
    } catch (ex) {
      setErr(ex?.message || "Could not read that file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        title="Fill this field from a .txt or Word (.docx) file"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <FileUp size={12} />}
        {busy ? "Reading…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.docx"
        className="hidden"
        onChange={handle}
      />
      {err && <span className="text-[11px] text-red-600">{err}</span>}
    </span>
  );
}
