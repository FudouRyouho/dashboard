import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schemas/schema';

export function createConnection(dbPath: string) {
  const sqlite = new Database(dbPath);
  return drizzle(sqlite, { schema });
}

export type DB = ReturnType<typeof createConnection>;
