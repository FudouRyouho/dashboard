import { createConnection, runMigrations, type DB } from './index';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface DatabaseConfig {
  path: string;
  migrationsFolder?: string;
}

export async function initializeDatabase(config: DatabaseConfig): Promise<DB> {
  const migrationsFolder =
    config.migrationsFolder ?? join(__dirname, '../migrations');
  const db = createConnection(config.path);
  await runMigrations(db, migrationsFolder);
  return db;
}

export async function connect(dbPath: string): Promise<DB> {
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
  return initializeDatabase({ path: dbPath });
}
