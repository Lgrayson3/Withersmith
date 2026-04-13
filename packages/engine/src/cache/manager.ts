import type { CacheMetrics } from '../client/types.js';
import type { CacheState, CacheManagerConfig } from './types.js';
import { DEFAULT_CACHE_MANAGER_CONFIG } from './types.js';

/**
 * Tracks cache economics across requests. This doesn't manage the
 * server-side cache (Anthropic handles that) - it monitors cache
 * hit/miss patterns and reports cost savings to the user.
 *
 * The Anthropic cache has a 5-minute TTL. Each cache hit refreshes
 * the timer. If the author pauses for more than 5 minutes between
 * turns, the cache drops and must be rebuilt on the next request.
 */
export class CacheManager {
  private config: CacheManagerConfig;
  private state: CacheState;

  constructor(config?: Partial<CacheManagerConfig>) {
    this.config = { ...DEFAULT_CACHE_MANAGER_CONFIG, ...config };
    this.state = {
      lastTurnTimestamp: null,
      totalCacheReads: 0,
      totalCacheWrites: 0,
      totalInputTokens: 0,
      totalCacheReadTokens: 0,
    };
  }

  recordMetrics(metrics: CacheMetrics): CacheReport {
    const now = Date.now();
    const gapMs = this.state.lastTurnTimestamp
      ? now - this.state.lastTurnTimestamp
      : 0;

    const cacheDropped = gapMs > this.config.cacheDropWarningThresholdMs;

    if (metrics.cacheReadInputTokens > 0) {
      this.state.totalCacheReads++;
    }
    if (metrics.cacheCreationInputTokens > 0) {
      this.state.totalCacheWrites++;
    }

    this.state.totalInputTokens += metrics.inputTokens;
    this.state.totalCacheReadTokens += metrics.cacheReadInputTokens;
    this.state.lastTurnTimestamp = now;

    return {
      cacheHit: metrics.cacheReadInputTokens > 0,
      cacheDropped,
      gapMs,
      savingsPercent: this.calculateSavingsPercent(),
      totalCacheReads: this.state.totalCacheReads,
      totalCacheWrites: this.state.totalCacheWrites,
    };
  }

  getState(): CacheState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      lastTurnTimestamp: null,
      totalCacheReads: 0,
      totalCacheWrites: 0,
      totalInputTokens: 0,
      totalCacheReadTokens: 0,
    };
  }

  /**
   * Calculates the percentage of input tokens served from cache.
   * Higher = more cost savings. At 90% cache hit rate, input costs
   * are reduced by approximately 81% (cache reads cost 10% of base).
   */
  private calculateSavingsPercent(): number {
    if (this.state.totalInputTokens === 0) return 0;
    return Math.round(
      (this.state.totalCacheReadTokens / this.state.totalInputTokens) * 100,
    );
  }
}

export interface CacheReport {
  cacheHit: boolean;
  cacheDropped: boolean;
  gapMs: number;
  savingsPercent: number;
  totalCacheReads: number;
  totalCacheWrites: number;
}
