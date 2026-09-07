import type { DB } from '../connection';
import { serverLogEntries } from '../schemas/server-logs';
import { desc, lt } from 'drizzle-orm';

export interface ServerLogEntryRow {
  id: number;
  timestamp: Date;
  level: string;
  source: string | null;
  message: string;
  detail: string | null;
}

export interface InsertServerLogInput {
  level: string;
  source?: string | null;
  message: string;
  detail?: string | null;
}

export async function insertServerLog(db: DB, input: InsertServerLogInput): Promise<ServerLogEntryRow | undefined> {
  const timestamp = new Date();
  const result = await db.insert(serverLogEntries).values({
    timestamp,
    level: input.level,
    source: input.source ?? null,
    message: input.message,
    detail: input.detail ?? null,
  }).returning();

  return result[0];
}

export async function listServerLogs(db: DB, limitVal = 100): Promise<ServerLogEntryRow[]> {
  return db
    .select()
    .from(serverLogEntries)
    .orderBy(desc(serverLogEntries.timestamp))
    .limit(limitVal);
}

export async function purgeServerLogsOlderThan(db: DB, cutoff: Date): Promise<{ deleted: number }> {
  const result = await db.delete(serverLogEntries).where(lt(serverLogEntries.timestamp, cutoff));
  // drizzle for better-sqlite3 runs synchronously and returns info about changes
  return { deleted: result.changes };
}
