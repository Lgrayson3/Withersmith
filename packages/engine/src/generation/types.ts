import type { CacheMetrics } from '../client/types.js';
import type { PromptHierarchy } from '../prompt/types.js';
import type { StyleArchive } from '../store/types.js';

export interface TwoPassConfig {
  passOneModel?: string;
  passTwoModel?: string;
  skipPassTwo: boolean;
  streamPassTwo: boolean;
  maxOutputTokens?: number;
}

export interface GenerationRequest {
  userMessage: string;
  hierarchy: PromptHierarchy;
  styleArchive?: StyleArchive;
  config: TwoPassConfig;
}

export interface GenerationResult {
  passOneOutput: string;
  passTwoOutput: string | null;
  metrics: GenerationMetrics;
}

export interface GenerationMetrics {
  passOneCacheMetrics: CacheMetrics;
  passTwoCacheMetrics: CacheMetrics | null;
  totalInputTokens: number;
  totalOutputTokens: number;
}
