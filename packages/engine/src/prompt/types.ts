import type { LoreDocument } from '../lore/types.js';

export interface PromptHierarchy {
  coreInstructions: string;
  loreDocuments: LoreDocument[];
  canonicalText: string;
  sessionContext: SessionContext;
}

export interface SessionContext {
  voiceNotes: string[];
  ephemeralOutline: string | null;
  recentTurns: ConversationTurn[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface CacheBreakpointConfig {
  /** Minimum estimated tokens for a block to receive a cache breakpoint. */
  minTokensForCache: number;
  /** Whether to apply cache_control to the lore block. */
  cacheLore: boolean;
  /** Whether to apply cache_control to the canonical reservoir block. */
  cacheCanonical: boolean;
}

export const DEFAULT_CACHE_CONFIG: CacheBreakpointConfig = {
  minTokensForCache: 1024,
  cacheLore: true,
  cacheCanonical: true,
};
