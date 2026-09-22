import { describe, test, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { existsSync, unlinkSync } from 'node:fs';
import {
  initializeDatabase,
  insertTaskRun,
  listTaskRuns,
  type InsertTaskRunInput,
} from '@dashboard/db';

describe('Database Initialization', () => {
  const tempPath = `./data/test-${randomUUID()}.sqlite`;
  const migrationsFolder = new URL(
    '../../../../packages/db/migrations',
    import.meta.url,
  ).pathname;

  afterEach(() => {
    try {
      unlinkSync(tempPath);
    } catch {}
  });

  test('initializeDatabase creates connection and runs migrations', async () => {
    expect(existsSync(tempPath)).toBe(false);

    const db = await initializeDatabase({ path: tempPath, migrationsFolder });
    expect(db, 'must return a DB instance').toBeTruthy();
  });

  test('initializeDatabase is idempotent (runs twice without error)', async () => {
    const db1 = await initializeDatabase({ path: tempPath, migrationsFolder });
    expect(db1).toBeTruthy();

    const db2 = await initializeDatabase({ path: tempPath, migrationsFolder });
    expect(db2).toBeTruthy();
  });

  test('database persists data across initializeDatabase calls', async () => {
    const db1 = await initializeDatabase({ path: tempPath, migrationsFolder });

    const input: InsertTaskRunInput = {
      taskId: 'test',
      startedAt: new Date(),
      durationMs: 100,
      outcome: 'success',
      cause: null,
      detail: null,
    };
    insertTaskRun(db1, input);

    const db2 = await initializeDatabase({ path: tempPath, migrationsFolder });

    const runs = listTaskRuns(db2, 'test');
    expect(runs.length).toBe(1);
    expect(runs[0] !== undefined, 'first run must not be undefined').toBeTruthy();
    expect(runs[0]!.taskId).toBe('test');
  });
});