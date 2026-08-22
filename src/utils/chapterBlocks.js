/**
 * chapterBlocks.js
 * A chapter's main content is an ordered list of blocks so figures and tables
 * can sit between paragraphs instead of only at the end.
 *
 * Block shapes:
 *   { id, type: "text",   content }
 *   { id, type: "figure", label, caption, description, imageData, imageName }
 *   { id, type: "table",  caption, headers, rows }
 *
 * For backward compatibility, chapters created before this change (which used
 * a single `body` string plus separate `tables`/`figures` arrays) are converted
 * on the fly: body first, then tables, then figures.
 */
export const blockUid = (p = "blk") =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function chapterBlocks(ch) {
  if (Array.isArray(ch.blocks) && ch.blocks.length) return ch.blocks;
  const out = [];
  if ((ch.body || "").trim()) out.push({ id: blockUid("text"), type: "text", content: ch.body });
  for (const t of ch.tables || []) out.push({ ...t, type: "table", id: t.id || blockUid("tbl") });
  for (const f of ch.figures || []) out.push({ ...f, type: "figure", id: f.id || blockUid("fig") });
  if (!out.length) out.push({ id: blockUid("text"), type: "text", content: "" });
  return out;
}
