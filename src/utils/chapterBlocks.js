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

/**
 * Extra ordered blocks (text / figure / table) attached to a section or a
 * sub-section. They print after that heading's own body text, exactly in the
 * order they were added.
 */
export function nodeBlocks(node) {
  return Array.isArray(node?.blocks) ? node.blocks : [];
}

/** Every block in a chapter — body, sections and sub-sections — in print order. */
export function allChapterBlocks(ch) {
  const out = [...chapterBlocks(ch)];
  for (const sec of ch.sections || []) {
    out.push(...nodeBlocks(sec));
    for (const sub of sec.subsections || []) out.push(...nodeBlocks(sub));
  }
  return out;
}
