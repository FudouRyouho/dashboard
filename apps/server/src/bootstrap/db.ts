import { connect } from '@dashboard/db';
import type { DB } from '@dashboard/db';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../../../../');

export async function createDatabase(): Promise<DB> {
  const dbPath =
    process.env.DASHBOARD_DB_PATH ||
    join(projectRoot, 'data', 'dashboard.sqlite');
  return connect(dbPath);
}
