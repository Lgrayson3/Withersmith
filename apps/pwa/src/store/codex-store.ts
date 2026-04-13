import type { CodexStore, LoreDocument } from '@withersmith/engine';
import { db } from './db';

export class DexieCodexStore implements CodexStore {
  async getLoreDocuments(): Promise<LoreDocument[]> {
    return db.loreDocuments.orderBy('priority').toArray();
  }

  async getLoreDocument(id: string): Promise<LoreDocument | undefined> {
    return db.loreDocuments.get(id);
  }

  async putLoreDocument(doc: LoreDocument): Promise<void> {
    await db.loreDocuments.put(doc);
  }

  async deleteLoreDocument(id: string): Promise<void> {
    await db.loreDocuments.delete(id);
  }
}
