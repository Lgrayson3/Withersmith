import { describe, it, expect } from 'vitest';
import { PromptBuilder, estimateTokens } from './builder.js';
import type { PromptHierarchy } from './types.js';

function makeHierarchy(overrides: Partial<PromptHierarchy> = {}): PromptHierarchy {
  return {
    coreInstructions: 'You are a writing assistant.',
    loreDocuments: [],
    canonicalText: '',
    sessionContext: {
      voiceNotes: [],
      ephemeralOutline: null,
      recentTurns: [],
    },
    ...overrides,
  };
}

describe('estimateTokens', () => {
  it('estimates ~4 chars per token', () => {
    expect(estimateTokens('hello world')).toBe(3); // 11 chars / 4 = 2.75 → 3
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('PromptBuilder', () => {
  it('builds system prompt with core instructions only', () => {
    const builder = new PromptBuilder();
    const blocks = builder.buildSystemPrompt(makeHierarchy());

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('text');
    expect(blocks[0].text).toBe('You are a writing assistant.');
    expect(blocks[0]).not.toHaveProperty('cache_control');
  });

  it('includes lore block with cache_control when above token threshold', () => {
    const builder = new PromptBuilder({ minTokensForCache: 10 });
    const hierarchy = makeHierarchy({
      loreDocuments: [
        {
          id: '1',
          category: 'cosmology',
          title: 'Realms',
          content: 'A'.repeat(200), // well above 10 tokens
          priority: 0,
          lastModified: Date.now(),
        },
      ],
    });

    const blocks = builder.buildSystemPrompt(hierarchy);
    expect(blocks.length).toBeGreaterThanOrEqual(2);

    const loreBlock = blocks[1];
    expect(loreBlock.text).toContain('<lore>');
    expect(loreBlock).toHaveProperty('cache_control');
    expect((loreBlock as any).cache_control).toEqual({ type: 'ephemeral' });
  });

  it('skips cache_control on lore block below token threshold', () => {
    const builder = new PromptBuilder({ minTokensForCache: 100000 });
    const hierarchy = makeHierarchy({
      loreDocuments: [
        {
          id: '1',
          category: 'cosmology',
          title: 'Short',
          content: 'Brief lore.',
          priority: 0,
          lastModified: Date.now(),
        },
      ],
    });

    const blocks = builder.buildSystemPrompt(hierarchy);
    const loreBlock = blocks[1];
    expect(loreBlock).not.toHaveProperty('cache_control');
  });

  it('includes canonical block with cache_control', () => {
    const builder = new PromptBuilder({ minTokensForCache: 10 });
    const hierarchy = makeHierarchy({
      canonicalText: 'Chapter 1: ' + 'A'.repeat(200),
    });

    const blocks = builder.buildSystemPrompt(hierarchy);
    const canonicalBlock = blocks.find((b) => b.text.includes('<canonical_manuscript>'));
    expect(canonicalBlock).toBeDefined();
    expect(canonicalBlock).toHaveProperty('cache_control');
  });

  it('includes session context block without cache_control', () => {
    const builder = new PromptBuilder();
    const hierarchy = makeHierarchy({
      sessionContext: {
        voiceNotes: ['The hero enters the cave'],
        ephemeralOutline: null,
        recentTurns: [],
      },
    });

    const blocks = builder.buildSystemPrompt(hierarchy);
    const sessionBlock = blocks.find((b) => b.text.includes('voice_notes'));
    expect(sessionBlock).toBeDefined();
    expect(sessionBlock).not.toHaveProperty('cache_control');
  });

  it('preserves block ordering: instructions, lore, canonical, session', () => {
    const builder = new PromptBuilder({ minTokensForCache: 10 });
    const hierarchy = makeHierarchy({
      loreDocuments: [
        {
          id: '1',
          category: 'cosmology',
          title: 'Realms',
          content: 'A'.repeat(200),
          priority: 0,
          lastModified: Date.now(),
        },
      ],
      canonicalText: 'B'.repeat(200),
      sessionContext: {
        voiceNotes: ['Test note'],
        ephemeralOutline: null,
        recentTurns: [],
      },
    });

    const blocks = builder.buildSystemPrompt(hierarchy);
    expect(blocks).toHaveLength(4);
    expect(blocks[0].text).toContain('writing assistant');
    expect(blocks[1].text).toContain('<lore>');
    expect(blocks[2].text).toContain('<canonical_manuscript>');
    expect(blocks[3].text).toContain('<voice_notes>');
  });

  it('respects cacheLore=false config', () => {
    const builder = new PromptBuilder({
      minTokensForCache: 10,
      cacheLore: false,
    });
    const hierarchy = makeHierarchy({
      loreDocuments: [
        {
          id: '1',
          category: 'cosmology',
          title: 'Realms',
          content: 'A'.repeat(200),
          priority: 0,
          lastModified: Date.now(),
        },
      ],
    });

    const blocks = builder.buildSystemPrompt(hierarchy);
    expect(blocks[1]).not.toHaveProperty('cache_control');
  });
});
