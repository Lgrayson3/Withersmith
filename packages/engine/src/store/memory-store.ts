import type { LoreDocument } from '../lore/types.js';
import type { ConversationTurn } from '../prompt/types.js';
import type {
  CodexStore,
  SessionStore,
  CanonicalStore,
  StyleStore,
  EngineStores,
  Session,
  SessionSummary,
  Chapter,
  StyleArchive,
} from './types.js';

class MemoryCodexStore implements CodexStore {
  private docs = new Map<string, LoreDocument>();

  async getLoreDocuments(): Promise<LoreDocument[]> {
    return [...this.docs.values()].sort((a, b) => a.priority - b.priority);
  }

  async getLoreDocument(id: string): Promise<LoreDocument | undefined> {
    return this.docs.get(id);
  }

  async putLoreDocument(doc: LoreDocument): Promise<void> {
    this.docs.set(doc.id, doc);
  }

  async deleteLoreDocument(id: string): Promise<void> {
    this.docs.delete(id);
  }
}

class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, Session>();

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async listSessions(): Promise<SessionSummary[]> {
    return [...this.sessions.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((s) => ({
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt,
        turnCount: s.turns.length,
      }));
  }

  async createSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async appendTurn(sessionId: string, turn: ConversationTurn): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    session.turns.push(turn);
    session.updatedAt = turn.timestamp;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}

class MemoryCanonicalStore implements CanonicalStore {
  private chapters = new Map<string, Chapter>();

  async getChapters(): Promise<Chapter[]> {
    return [...this.chapters.values()].sort((a, b) => a.number - b.number);
  }

  async getChapter(id: string): Promise<Chapter | undefined> {
    return this.chapters.get(id);
  }

  async putChapter(chapter: Chapter): Promise<void> {
    this.chapters.set(chapter.id, chapter);
  }

  async deleteChapter(id: string): Promise<void> {
    this.chapters.delete(id);
  }

  async getFullText(): Promise<string> {
    const chapters = await this.getChapters();
    return chapters.map((c) => c.content).join('\n\n');
  }
}

class MemoryStyleStore implements StyleStore {
  private archive: StyleArchive | undefined;

  async getStyleArchive(): Promise<StyleArchive | undefined> {
    return this.archive;
  }

  async putStyleArchive(archive: StyleArchive): Promise<void> {
    this.archive = archive;
  }
}

export class MemoryStore implements EngineStores {
  codex: CodexStore = new MemoryCodexStore();
  sessions: SessionStore = new MemorySessionStore();
  canonical: CanonicalStore = new MemoryCanonicalStore();
  style: StyleStore = new MemoryStyleStore();
}
