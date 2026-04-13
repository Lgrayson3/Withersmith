import type { LoreDocument } from './types.js';

/**
 * Assembles an array of lore documents into a single XML-tagged string
 * for injection into the system prompt. Documents are sorted by priority
 * and grouped by category.
 */
export function assembleLore(documents: LoreDocument[]): string {
  if (documents.length === 0) return '';

  const sorted = [...documents].sort((a, b) => a.priority - b.priority);
  const lines: string[] = ['<lore>'];

  for (const doc of sorted) {
    lines.push(`  <${doc.category} title="${escapeXmlAttr(doc.title)}">`);
    lines.push(`    ${doc.content.trim()}`);
    lines.push(`  </${doc.category}>`);
  }

  lines.push('</lore>');
  return lines.join('\n');
}

function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
