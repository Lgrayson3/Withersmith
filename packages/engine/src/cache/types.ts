export interface CacheState {
  lastTurnTimestamp: number | null;
  totalCacheReads: number;
  totalCacheWrites: number;
  totalInputTokens: number;
  totalCacheReadTokens: number;
}

export interface CacheManagerConfig {
  /** If gap between turns exceeds this, log a warning about potential cache drops. */
  cacheDropWarningThresholdMs: number;
}

export const DEFAULT_CACHE_MANAGER_CONFIG: CacheManagerConfig = {
  cacheDropWarningThresholdMs: 5 * 60 * 1000, // 5 minutes
};
