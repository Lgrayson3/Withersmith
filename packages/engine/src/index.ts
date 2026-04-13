// @withersmith/engine - Framework-agnostic AI writing engine
// Core types
export type {
  EngineClientConfig,
  CacheMetrics,
} from './client/types.js';

export type {
  PromptHierarchy,
  SessionContext,
  ConversationTurn,
  CacheBreakpointConfig,
} from './prompt/types.js';

export type {
  LoreCategory,
  LoreDocument,
} from './lore/types.js';

export type {
  TwoPassConfig,
  GenerationRequest,
  GenerationResult,
} from './generation/types.js';

export type {
  CacheState,
  CacheManagerConfig,
} from './cache/types.js';

export type {
  CodexStore,
  SessionStore,
  CanonicalStore,
  StyleStore,
  EngineStores,
  Session,
  SessionSummary,
  Chapter,
  StyleArchive,
} from './store/types.js';

// Implementations
export { AdventClient } from './client/anthropic-client.js';
export { PromptBuilder } from './prompt/builder.js';
export { buildPromptHierarchy } from './prompt/hierarchy.js';
export { assembleLore } from './lore/parser.js';
export { TwoPassGenerator } from './generation/two-pass.js';
export { CacheManager } from './cache/manager.js';
export { MemoryStore } from './store/memory-store.js';
