import { describe, it, expect } from 'vitest';
import { assembleLore } from './parser.js';
import type { LoreDocument } from './types.js';

function makeLore(overrides: Partial<LoreDocument> = {}): LoreDocument {
  return {
    id: 'test-1',
    category: 'cosmology',
    title: 'The Three Realms',
    content: 'There are three interconnected realms.',
    priority: 0,
    lastModified: Date.now(),
    ...overrides,
  };
}

describe('assembleLore', () => {
  it('returns empty string for no documents', () => {
    expect(assembleLore([])).toBe('');
  });

  it('wraps a single document in XML tags', () => {
    const result = assembleLore([makeLore()]);
    expect(result).toContain('<lore>');
    expect(result).toContain('</lore>');
    expect(result).toContain('<cosmology title="The Three Realms">');
    expect(result).toContain('</cosmology>');
    expect(result).toContain('There are three interconnected realms.');
  });

  it('sorts documents by priority', () => {
    const docs = [
      makeLore({ id: 'b', priority: 2, title: 'Second' }),
      makeLore({ id: 'a', priority: 0, title: 'First' }),
      makeLore({ id: 'c', priority: 1, title: 'Middle' }),
    ];
    const result = assembleLore(docs);
    const firstIdx = result.indexOf('First');
    const middleIdx = result.indexOf('Middle');
    const secondIdx = result.indexOf('Second');
    expect(firstIdx).toBeLessThan(middleIdx);
    expect(middleIdx).toBeLessThan(secondIdx);
  });

  it('escapes XML characters in titles', () => {
    const doc = makeLore({ title: 'The "Dark" & <Light> Realms' });
    const result = assembleLore([doc]);
    expect(result).toContain('&quot;Dark&quot;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;Light&gt;');
  });

  it('handles multiple categories', () => {
    const docs = [
      makeLore({ id: '1', category: 'cosmology', title: 'Cosmos' }),
      makeLore({ id: '2', category: 'character_profiles', title: 'Heroes', priority: 1 }),
    ];
    const result = assembleLore(docs);
    expect(result).toContain('<cosmology');
    expect(result).toContain('<character_profiles');
  });
});
