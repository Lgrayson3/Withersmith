import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from './memory-store.js';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  describe('CodexStore', () => {
    it('stores and retrieves lore documents', async () => {
      await store.codex.putLoreDocument({
        id: '1',
        category: 'cosmology',
        title: 'Test',
        content: 'Content',
        priority: 0,
        lastModified: Date.now(),
      });

      const doc = await store.codex.getLoreDocument('1');
      expect(doc).toBeDefined();
      expect(doc!.title).toBe('Test');
    });

    it('returns documents sorted by priority', async () => {
      await store.codex.putLoreDocument({
        id: 'b', category: 'cosmology', title: 'B',
        content: '', priority: 2, lastModified: Date.now(),
      });
      await store.codex.putLoreDocument({
        id: 'a', category: 'cosmology', title: 'A',
        content: '', priority: 0, lastModified: Date.now(),
      });

      const docs = await store.codex.getLoreDocuments();
      expect(docs[0].id).toBe('a');
      expect(docs[1].id).toBe('b');
    });

    it('deletes documents', async () => {
      await store.codex.putLoreDocument({
        id: '1', category: 'cosmology', title: 'Test',
        content: '', priority: 0, lastModified: Date.now(),
      });
      await store.codex.deleteLoreDocument('1');
      const doc = await store.codex.getLoreDocument('1');
      expect(doc).toBeUndefined();
    });
  });

  describe('SessionStore', () => {
    it('creates and retrieves sessions', async () => {
      await store.sessions.createSession({
        id: 's1',
        title: 'Session 1',
        chapterId: null,
        createdAt: 1000,
        updatedAt: 1000,
        turns: [],
      });

      const session = await store.sessions.getSession('s1');
      expect(session).toBeDefined();
      expect(session!.title).toBe('Session 1');
    });

    it('appends turns and updates timestamp', async () => {
      await store.sessions.createSession({
        id: 's1',
        title: 'Test',
        chapterId: null,
        createdAt: 1000,
        updatedAt: 1000,
        turns: [],
      });

      await store.sessions.appendTurn('s1', {
        role: 'user',
        content: 'Hello',
        timestamp: 2000,
      });

      const session = await store.sessions.getSession('s1');
      expect(session!.turns).toHaveLength(1);
      expect(session!.updatedAt).toBe(2000);
    });

    it('lists sessions sorted by updatedAt descending', async () => {
      await store.sessions.createSession({
        id: 's1', title: 'Old', chapterId: null,
        createdAt: 1000, updatedAt: 1000, turns: [],
      });
      await store.sessions.createSession({
        id: 's2', title: 'New', chapterId: null,
        createdAt: 2000, updatedAt: 2000, turns: [],
      });

      const list = await store.sessions.listSessions();
      expect(list[0].id).toBe('s2');
    });
  });

  describe('CanonicalStore', () => {
    it('stores and retrieves chapters', async () => {
      await store.canonical.putChapter({
        id: 'ch1', number: 1, title: 'Chapter 1',
        content: 'It was a dark night.', summary: '', lastModified: Date.now(),
      });

      const chapter = await store.canonical.getChapter('ch1');
      expect(chapter!.content).toBe('It was a dark night.');
    });

    it('getFullText concatenates chapters in order', async () => {
      await store.canonical.putChapter({
        id: 'ch2', number: 2, title: 'Two',
        content: 'Chapter two.', summary: '', lastModified: Date.now(),
      });
      await store.canonical.putChapter({
        id: 'ch1', number: 1, title: 'One',
        content: 'Chapter one.', summary: '', lastModified: Date.now(),
      });

      const text = await store.canonical.getFullText();
      expect(text).toBe('Chapter one.\n\nChapter two.');
    });
  });

  describe('StyleStore', () => {
    it('stores and retrieves style archive', async () => {
      await store.style.putStyleArchive({
        id: 'default',
        content: 'The author prefers short, punchy sentences.',
        lastModified: Date.now(),
      });

      const archive = await store.style.getStyleArchive();
      expect(archive).toBeDefined();
      expect(archive!.content).toContain('punchy sentences');
    });

    it('returns undefined when no archive exists', async () => {
      const archive = await store.style.getStyleArchive();
      expect(archive).toBeUndefined();
    });
  });
});
