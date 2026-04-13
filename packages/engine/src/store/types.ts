import type { LoreDocument } from '../lore/types.js';
import type { ConversationTurn } from '../prompt/types.js';

// --- Codex Store ---

export interface CodexStore {
  getLoreDocuments(): Promise<LoreDocument[]>;
  getLoreDocument(id: string): Promise<LoreDocument | undefined>;
  putLoreDocument(doc: LoreDocument): Promise<void>;
  deleteLoreDocument(id: string): Promise<void>;
}

// --- Session Store ---

export interface Session {
  id: string;
  title: string;
  chapterId: string | null;
  createdAt: number;
  updatedAt: number;
  turns: ConversationTurn[];
}

export interface SessionSummary {
  id: string;
  title: string;
  updatedAt: number;
  turnCount: number;
}

export interface SessionStore {
  getSession(id: string): Promise<Session | undefined>;
  listSessions(): Promise<SessionSummary[]>;
  createSession(session: Session): Promise<void>;
  appendTurn(sessionId: string, turn: ConversationTurn): Promise<void>;
  deleteSession(id: string): Promise<void>;
}

// --- Canonical Store ---

export interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  summary: string;
  lastModified: number;
}

export interface CanonicalStore {
  getChapters(): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | undefined>;
  putChapter(chapter: Chapter): Promise<void>;
  deleteChapter(id: string): Promise<void>;
  getFullText(): Promise<string>;
}

// --- Style Store ---

export interface StyleArchive {
  id: string;
  content: string;
  lastModified: number;
}

export interface StyleStore {
  getStyleArchive(): Promise<StyleArchive | undefined>;
  putStyleArchive(archive: StyleArchive): Promise<void>;
}

// --- Aggregate ---

export interface EngineStores {
  codex: CodexStore;
  sessions: SessionStore;
  canonical: CanonicalStore;
  style: StyleStore;
}
