import type { PromptHierarchy, SessionContext } from './types.js';
import { assembleLore } from '../lore/parser.js';

/**
 * Builds the dynamic session context section of the prompt.
 * This is the most volatile part - it changes every turn and is never cached.
 */
export function buildSessionContextBlock(ctx: SessionContext): string {
  const parts: string[] = [];

  if (ctx.voiceNotes.length > 0) {
    parts.push('<voice_notes>');
    for (const note of ctx.voiceNotes) {
      parts.push(`  <note>${note}</note>`);
    }
    parts.push('</voice_notes>');
  }

  if (ctx.ephemeralOutline) {
    parts.push(`<scene_outline>\n  ${ctx.ephemeralOutline}\n</scene_outline>`);
  }

  return parts.join('\n');
}

/**
 * Decomposes a PromptHierarchy into the four text blocks used by
 * the PromptBuilder to construct the system prompt array with
 * cache breakpoints.
 */
export function buildPromptHierarchy(hierarchy: PromptHierarchy): {
  coreInstructions: string;
  loreBlock: string;
  canonicalBlock: string;
  sessionBlock: string;
} {
  return {
    coreInstructions: hierarchy.coreInstructions,
    loreBlock: assembleLore(hierarchy.loreDocuments),
    canonicalBlock: hierarchy.canonicalText
      ? `<canonical_manuscript>\n${hierarchy.canonicalText}\n</canonical_manuscript>`
      : '',
    sessionBlock: buildSessionContextBlock(hierarchy.sessionContext),
  };
}
