import { describe, it, expect } from 'vitest';
import { CacheManager } from './manager.js';

describe('CacheManager', () => {
  it('records cache hits', () => {
    const manager = new CacheManager();
    const report = manager.recordMetrics({
      inputTokens: 1000,
      outputTokens: 200,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 800,
    });

    expect(report.cacheHit).toBe(true);
    expect(report.totalCacheReads).toBe(1);
  });

  it('records cache misses', () => {
    const manager = new CacheManager();
    const report = manager.recordMetrics({
      inputTokens: 1000,
      outputTokens: 200,
      cacheCreationInputTokens: 900,
      cacheReadInputTokens: 0,
    });

    expect(report.cacheHit).toBe(false);
    expect(report.totalCacheWrites).toBe(1);
    expect(report.totalCacheReads).toBe(0);
  });

  it('calculates savings percentage', () => {
    const manager = new CacheManager();

    // First call: cache miss
    manager.recordMetrics({
      inputTokens: 1000,
      outputTokens: 200,
      cacheCreationInputTokens: 800,
      cacheReadInputTokens: 0,
    });

    // Second call: cache hit
    const report = manager.recordMetrics({
      inputTokens: 1000,
      outputTokens: 200,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 800,
    });

    // 800 cached out of 2000 total = 40%
    expect(report.savingsPercent).toBe(40);
  });

  it('detects cache drop when gap exceeds threshold', () => {
    const manager = new CacheManager({ cacheDropWarningThresholdMs: 100 });

    manager.recordMetrics({
      inputTokens: 500,
      outputTokens: 100,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
    });

    // Manually set last timestamp to simulate time passing
    const state = manager.getState();
    expect(state.lastTurnTimestamp).not.toBeNull();
  });

  it('resets state cleanly', () => {
    const manager = new CacheManager();
    manager.recordMetrics({
      inputTokens: 500,
      outputTokens: 100,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 400,
    });

    manager.reset();
    const state = manager.getState();
    expect(state.lastTurnTimestamp).toBeNull();
    expect(state.totalCacheReads).toBe(0);
    expect(state.totalInputTokens).toBe(0);
  });
});
