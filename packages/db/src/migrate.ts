import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DB } from './connection';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(
  db: DB,
  migrationsFolder: string = path.resolve(__dirname, '../../migrations'),
): Promise<void> {
  await migrate(db, { migrationsFolder });
}
