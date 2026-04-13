import type { StyleStore, StyleArchive } from '@withersmith/engine';
import { db } from './db';

const SINGLETON_ID = 'default';

export class DexieStyleStore implements StyleStore {
  async getStyleArchive(): Promise<StyleArchive | undefined> {
    return db.styleArchive.get(SINGLETON_ID);
  }

  async putStyleArchive(archive: StyleArchive): Promise<void> {
    await db.styleArchive.put({ ...archive, id: SINGLETON_ID });
  }
}
