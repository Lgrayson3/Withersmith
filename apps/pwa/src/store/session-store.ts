import type {
  SessionStore,
  Session,
  SessionSummary,
  ConversationTurn,
} from '@withersmith/engine';
import { db } from './db';

export class DexieSessionStore implements SessionStore {
  async getSession(id: string): Promise<Session | undefined> {
    const record = await db.sessions.get(id);
    if (!record) return undefined;
    return {
      ...record,
      turns: JSON.parse(record.turns) as ConversationTurn[],
    };
  }

  async listSessions(): Promise<SessionSummary[]> {
    const records = await db.sessions.orderBy('updatedAt').reverse().toArray();
    return records.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updatedAt,
      turnCount: (JSON.parse(r.turns) as ConversationTurn[]).length,
    }));
  }

  async createSession(session: Session): Promise<void> {
    await db.sessions.put({
      ...session,
      turns: JSON.stringify(session.turns),
    });
  }

  async appendTurn(sessionId: string, turn: ConversationTurn): Promise<void> {
    const record = await db.sessions.get(sessionId);
    if (!record) throw new Error(`Session ${sessionId} not found`);

    const turns = JSON.parse(record.turns) as ConversationTurn[];
    turns.push(turn);

    await db.sessions.update(sessionId, {
      turns: JSON.stringify(turns),
      updatedAt: turn.timestamp,
    });
  }

  async deleteSession(id: string): Promise<void> {
    await db.sessions.delete(id);
  }
}
