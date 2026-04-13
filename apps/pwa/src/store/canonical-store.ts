import type { CanonicalStore, Chapter } from '@withersmith/engine';
import { db } from './db';

export class DexieCanonicalStore implements CanonicalStore {
  async getChapters(): Promise<Chapter[]> {
    return db.chapters.orderBy('number').toArray();
  }

  async getChapter(id: string): Promise<Chapter | undefined> {
    return db.chapters.get(id);
  }

  async putChapter(chapter: Chapter): Promise<void> {
    await db.chapters.put(chapter);
  }

  async deleteChapter(id: string): Promise<void> {
    await db.chapters.delete(id);
  }

  async getFullText(): Promise<string> {
    const chapters = await this.getChapters();
    return chapters.map((c) => c.content).join('\n\n');
  }
}
