import { useLiveQuery } from 'dexie-react-hooks';
import type { Chapter } from '@withersmith/engine';
import { db } from '../store/db';
import { DexieCanonicalStore } from '../store/canonical-store';

const store = new DexieCanonicalStore();

export function useChapters() {
  const chapters = useLiveQuery(() =>
    db.chapters.orderBy('number').toArray(),
  );

  return {
    chapters: chapters ?? [],
    isLoading: chapters === undefined,

    crystallize: async (title: string, content: string): Promise<string> => {
      const existing = await db.chapters.orderBy('number').reverse().first();
      const nextNumber = (existing?.number ?? 0) + 1;
      const id = crypto.randomUUID();

      await store.putChapter({
        id,
        number: nextNumber,
        title,
        content,
        summary: '',
        lastModified: Date.now(),
      });

      return id;
    },

    updateChapter: async (id: string, updates: Partial<Chapter>) => {
      const existing = await store.getChapter(id);
      if (!existing) throw new Error(`Chapter ${id} not found`);
      await store.putChapter({
        ...existing,
        ...updates,
        lastModified: Date.now(),
      });
    },

    deleteChapter: (id: string) => store.deleteChapter(id),

    getFullCanonicalText: () => store.getFullText(),
  };
}
