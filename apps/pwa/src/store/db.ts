import Dexie, { type EntityTable } from 'dexie';
import type { LoreCategory } from '@withersmith/engine';

export interface LoreDocRecord {
  id: string;
  category: LoreCategory;
  title: string;
  content: string;
  priority: number;
  lastModified: number;
}

export interface SessionRecord {
  id: string;
  title: string;
  chapterId: string | null;
  createdAt: number;
  updatedAt: number;
  /** JSON-serialized ConversationTurn[] */
  turns: string;
}

export interface ChapterRecord {
  id: string;
  number: number;
  title: string;
  content: string;
  summary: string;
  lastModified: number;
}

export interface StyleArchiveRecord {
  id: string;
  content: string;
  lastModified: number;
}

export interface SettingsRecord {
  key: string;
  value: string;
}

export const db = new Dexie('AdventWritingEngine') as Dexie & {
  loreDocuments: EntityTable<LoreDocRecord, 'id'>;
  sessions: EntityTable<SessionRecord, 'id'>;
  chapters: EntityTable<ChapterRecord, 'id'>;
  styleArchive: EntityTable<StyleArchiveRecord, 'id'>;
  settings: EntityTable<SettingsRecord, 'key'>;
};

db.version(1).stores({
  loreDocuments: 'id, category, priority, lastModified',
  sessions: 'id, updatedAt',
  chapters: 'id, number',
  styleArchive: 'id',
  settings: 'key',
});
