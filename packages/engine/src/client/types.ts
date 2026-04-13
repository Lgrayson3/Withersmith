export interface EngineClientConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  onCacheMetrics?: (metrics: CacheMetrics) => void;
}

export interface CacheMetrics {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

export const DEFAULT_MODEL = 'claude-sonnet-4-6';
