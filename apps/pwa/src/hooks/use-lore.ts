import { useLiveQuery } from 'dexie-react-hooks';
import type { LoreDocument, LoreCategory } from '@withersmith/engine';
import { db } from '../store/db';
import { DexieCodexStore } from '../store/codex-store';

const store = new DexieCodexStore();

export function useLoreDocuments() {
  const documents = useLiveQuery(() =>
    db.loreDocuments.orderBy('priority').toArray(),
  );

  return {
    documents: documents ?? [],
    isLoading: documents === undefined,
    addDocument: async (doc: Omit<LoreDocument, 'id' | 'lastModified'>) => {
      const id = crypto.randomUUID();
      await store.putLoreDocument({
        ...doc,
        id,
        lastModified: Date.now(),
      });
      return id;
    },
    updateDocument: async (id: string, updates: Partial<LoreDocument>) => {
      const existing = await store.getLoreDocument(id);
      if (!existing) throw new Error(`Lore document ${id} not found`);
      await store.putLoreDocument({
        ...existing,
        ...updates,
        lastModified: Date.now(),
      });
    },
    deleteDocument: (id: string) => store.deleteLoreDocument(id),
  };
}
