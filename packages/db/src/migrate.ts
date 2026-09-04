import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { DB } from './connection';

export async function runMigrations(
  db: DB,
  migrationsFolder: string,
): Promise<void> {
  await migrate(db, { migrationsFolder });
}
