import { describe, test, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdirSync, unlinkSync } from 'node:fs';
import { initializeDatabase, insertTaskRun, listTaskRuns } from '@dashboard/db';

describe('Database Persistence E2E', () => {
  const tempPath = `./data/test-persistence-${randomUUID()}.sqlite`;
  const migrationsFolder = new URL(
    '../../../../packages/db/migrations',
    import.meta.url,
  ).pathname;

  afterEach(() => {
    try {
      unlinkSync(tempPath);
    } catch {}
  });

  test('data persists across database instances', async () => {
    // First instance
    const db1 = await initializeDatabase({ path: tempPath, migrationsFolder });

    insertTaskRun(db1, {
      taskId: 'persist-test',
      startedAt: new Date(),
      durationMs: 500,
      outcome: 'success',
      cause: null,
      detail: { message: 'First instance' },
    });

    const runs1 = listTaskRuns(db1, 'persist-test');
    expect(runs1.length).toBe(1, 'should have 1 run in the first instance');

    const db2 = await initializeDatabase({ path: tempPath, migrationsFolder });

    const runs2 = listTaskRuns(db2, 'persist-test');
    expect(runs2.length).toBe(1, 'the run must persist in the second instance');
    expect(runs2[0]!.taskId).toBe('persist-test');
    expect(runs2[0]!.detail).toEqual({ message: 'First instance' });
  });

  test('multiple runs persist correctly', async () => {
    const db = await initializeDatabase({ path: tempPath, migrationsFolder });

    for (let i = 0; i < 5; i++) {
      insertTaskRun(db, {
        taskId: `task-${i}`,
        startedAt: new Date(Date.now() - i * 60000),
        durationMs: 100 * (i + 1),
        outcome: i % 2 === 0 ? 'success' : 'failure',
        cause: i % 2 === 0 ? null : 'timeout',
        detail: null,
      });
    }

    const allRuns = listTaskRuns(db, 'task-0');
    expect(allRuns.length).toBe(1);

    for (let i = 0; i < 5; i++) {
      const runs = listTaskRuns(db, `task-${i}`);
      expect(runs.length).toBe(1, `task-${i} should have 1 run`);
    }
  });
});