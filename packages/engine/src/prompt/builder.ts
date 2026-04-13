import type Anthropic from '@anthropic-ai/sdk';
import type { PromptHierarchy, CacheBreakpointConfig } from './types.js';
import { DEFAULT_CACHE_CONFIG } from './types.js';
import { buildPromptHierarchy } from './hierarchy.js';

type TextBlockParam = Anthropic.Messages.TextBlockParam;

/**
 * Constructs the system prompt as an array of TextBlockParam objects
 * with cache_control breakpoints placed for maximum cache efficiency.
 *
 * Hierarchy (most stable at top, most volatile at bottom):
 *   Block 0: Core instruction set (no cache_control)
 *   Block 1: Static lore (cache_control: ephemeral) -- FIRST BREAKPOINT
 *   Block 2: Canonical reservoir (cache_control: ephemeral) -- SECOND BREAKPOINT
 *   Block 3: Dynamic session context (no cache_control)
 *
 * The Anthropic API uses a 5-minute cache TTL by default. Content above
 * a cache_control breakpoint is eligible for caching. Every new cache hit
 * refreshes the timer, keeping lore "warm" during active drafting sessions.
 */
export class PromptBuilder {
  private config: CacheBreakpointConfig;

  constructor(config?: Partial<CacheBreakpointConfig>) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  buildSystemPrompt(hierarchy: PromptHierarchy): TextBlockParam[] {
    const { coreInstructions, loreBlock, canonicalBlock, sessionBlock } =
      buildPromptHierarchy(hierarchy);

    const blocks: TextBlockParam[] = [];

    // Block 0: Core instructions - always present, part of cached prefix
    blocks.push({ type: 'text', text: coreInstructions });

    // Block 1: Static lore with first cache breakpoint
    if (loreBlock) {
      blocks.push(
        this.maybeCache({ type: 'text', text: loreBlock }, this.config.cacheLore),
      );
    }

    // Block 2: Canonical reservoir with second cache breakpoint
    if (canonicalBlock) {
      blocks.push(
        this.maybeCache({ type: 'text', text: canonicalBlock }, this.config.cacheCanonical),
      );
    }

    // Block 3: Dynamic session context - never cached
    if (sessionBlock) {
      blocks.push({ type: 'text', text: sessionBlock });
    }

    return blocks;
  }

  updateConfig(updates: Partial<CacheBreakpointConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): CacheBreakpointConfig {
    return { ...this.config };
  }

  private maybeCache(block: TextBlockParam, shouldCache: boolean): TextBlockParam {
    if (!shouldCache) return block;

    const estimatedTokens = estimateTokens(block.text);
    if (estimatedTokens < this.config.minTokensForCache) {
      return block;
    }

    return {
      ...block,
      cache_control: { type: 'ephemeral' },
    };
  }
}

/** Rough token estimate: ~4 characters per token for English text. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
