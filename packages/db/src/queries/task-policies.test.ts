import { test, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { initializeDatabase } from '@dashboard/db';
import {
  getAllPoliciesByIntegrationId,
  getPolicyByIntegrationAndType,
  upsertTaskPolicy,
  deleteTaskPolicy,
} from './task-policies.js';
import { upsertIntegration } from './integrations.js';

const tempPath = () => `./data/test-policies-${randomUUID()}.sqlite`;
const migrationsFolder = new URL(
  '../../migrations',
  import.meta.url,
).pathname;

async function withTempDb<T>(
  fn: (db: Awaited<ReturnType<typeof initializeDatabase>>) => Promise<T>,
): Promise<T> {
  const path = tempPath();
  const db = await initializeDatabase({ path, migrationsFolder });
  try {
    return await fn(db);
  } finally {
    try {
      unlinkSync(path);
    } catch {}
  }
}

test('getAllPoliciesByIntegrationId returns empty array when no policies', async () => {
  await withTempDb(async (db) => {
    const policies = await getAllPoliciesByIntegrationId(db, 'integration-1');
    expect(policies.length).toBe(0, 'Debe retornar array vacío');
  });
});

test('getAllPoliciesByIntegrationId returns policies for integration', async () => {
  await withTempDb(async (db) => {
    const integrationId = randomUUID();
    
    // Create integration instance first (FK requirement)
    await upsertIntegration(db, {
      id: integrationId,
      kind: 'sonarr',
      name: 'TestSonarr',
      url: 'http://localhost:8989',
    });

    await upsertTaskPolicy(db, {
      id: randomUUID(),
      integrationId,
      taskType: 'calendar',
      everyMs: 14400000,
      runOnStart: true,
      expectedDurationMs: 3000,
      failureMaxAttempts: 3,
      failureCooldownMs: 60000,
    });

    await upsertTaskPolicy(db, {
      id: randomUUID(),
      integrationId,
      taskType: 'mediaReleases',
      everyMs: 3600000,
      runOnStart: false,
      expectedDurationMs: 5000,
      failureMaxAttempts: 2,
      failureCooldownMs: 30000,
    });

    const policies = await getAllPoliciesByIntegrationId(db, integrationId);
    expect(policies.length).toBe(2, 'Debe haber 2 políticas');
  });
});

test('getPolicyByIntegrationAndType returns null when not found', async () => {
  await withTempDb(async (db) => {
    const result = await getPolicyByIntegrationAndType(db, 'integration-1', 'calendar');
    expect(result).toBe(null, 'Debe retornar null cuando no existe');
  });
});

test('getPolicyByIntegrationAndType returns policy when exists', async () => {
  await withTempDb(async (db) => {
    const integrationId = randomUUID();
    const id = randomUUID();
    
    // Create integration instance first (FK requirement)
    await upsertIntegration(db, {
      id: integrationId,
      kind: 'sonarr',
      name: 'TestSonarr',
      url: 'http://localhost:8989',
    });

    await upsertTaskPolicy(db, {
      id,
      integrationId,
      taskType: 'calendar',
      everyMs: 14400000,
      runOnStart: true,
      expectedDurationMs: 3000,
      failureMaxAttempts: 3,
      failureCooldownMs: 60000,
    });

    const result = await getPolicyByIntegrationAndType(db, integrationId, 'calendar');
    expect(result, 'Debe encontrar la política').toBeTruthy();
    expect(result!.id).toBe(id);
    expect(result!.taskType).toBe('calendar');
    expect(result!.everyMs).toBe(14400000);
    expect(result!.runOnStart).toBe(true);
  });
});

test('upsertTaskPolicy creates new policy', async () => {
  await withTempDb(async (db) => {
    const integrationId = randomUUID();
    const id = randomUUID();
    
    // Create integration instance first (FK requirement)
    await upsertIntegration(db, {
      id: integrationId,
      kind: 'sonarr',
      name: 'TestSonarr',
      url: 'http://localhost:8989',
    });

    await upsertTaskPolicy(db, {
      id,
      integrationId,
      taskType: 'mediaReleases',
      everyMs: 3600000,
      runOnStart: false,
      expectedDurationMs: 5000,
      failureMaxAttempts: 2,
      failureCooldownMs: 30000,
    });

    const result = await getPolicyByIntegrationAndType(db, integrationId, 'mediaReleases');
    expect(result, 'Debe existir después de insertar').toBeTruthy();
    expect(result!.expectedDurationMs).toBe(5000);
  });
});

test('upsertTaskPolicy updates existing policy', async () => {
  await withTempDb(async (db) => {
    const integrationId = randomUUID();
    const id = randomUUID();
    
    // Create integration instance first (FK requirement)
    await upsertIntegration(db, {
      id: integrationId,
      kind: 'sonarr',
      name: 'TestSonarr',
      url: 'http://localhost:8989',
    });

    await upsertTaskPolicy(db, {
      id,
      integrationId,
      taskType: 'calendar',
      everyMs: 14400000,
      runOnStart: true,
      expectedDurationMs: 3000,
      failureMaxAttempts: 3,
      failureCooldownMs: 60000,
    });

    await upsertTaskPolicy(db, {
      id,
      integrationId,
      taskType: 'calendar',
      everyMs: 7200000,
      runOnStart: false,
      expectedDurationMs: 4000,
      failureMaxAttempts: 5,
      failureCooldownMs: 120000,
    });

    const result = await getPolicyByIntegrationAndType(db, integrationId, 'calendar');
    expect(result, 'Debe existir después de actualizar').toBeTruthy();
    expect(result!.everyMs).toBe(7200000, 'Debe tener valor actualizado');
    expect(result!.runOnStart).toBe(false, 'runOnStart debe ser false');
    expect(result!.failureMaxAttempts).toBe(5, 'failureMaxAttempts debe ser 5');
  });
});

test('upsertTaskPolicy maintains unique constraint', async () => {
  await withTempDb(async (db) => {
    const integrationId = randomUUID();
    
    // Create integration instance first (FK requirement)
    await upsertIntegration(db, {
      id: integrationId,
      kind: 'sonarr',
      name: 'TestSonarr',
      url: 'http://localhost:8989',
    });

    await upsertTaskPolicy(db, {
      id: randomUUID(),
      integrationId,
      taskType: 'calendar',
      everyMs: 14400000,
      runOnStart: true,
      expectedDurationMs: 3000,
      failureMaxAttempts: 3,
      failureCooldownMs: 60000,
    });

    // Insertar otra política para el mismo integrationId pero diferente taskType
    await upsertTaskPolicy(db, {
      id: randomUUID(),
      integrationId,
      taskType: 'mediaReleases',
      everyMs: 3600000,
      runOnStart: false,
      expectedDurationMs: 5000,
      failureMaxAttempts: 2,
      failureCooldownMs: 30000,
    });

    const policies = await getAllPoliciesByIntegrationId(db, integrationId);
    expect(policies.length).toBe(2, 'Debe haber 2 políticas diferentes por taskType');
  });
});

test('deleteTaskPolicy removes policy', async () => {
  await withTempDb(async (db) => {
    const integrationId = randomUUID();
    const id = randomUUID();
    
    // Create integration instance first (FK requirement)
    await upsertIntegration(db, {
      id: integrationId,
      kind: 'sonarr',
      name: 'TestSonarr',
      url: 'http://localhost:8989',
    });

    await upsertTaskPolicy(db, {
      id,
      integrationId,
      taskType: 'calendar',
      everyMs: 14400000,
      runOnStart: true,
      expectedDurationMs: 3000,
      failureMaxAttempts: 3,
      failureCooldownMs: 60000,
    });

    await deleteTaskPolicy(db, integrationId, 'calendar');

    const result = await getPolicyByIntegrationAndType(db, integrationId, 'calendar');
    expect(result).toBe(null, 'Debe retornar null después de eliminar');
  });
});

test('deleteTaskPolicy is idempotent', async () => {
  await withTempDb(async (db) => {
    const integrationId = randomUUID();
    await deleteTaskPolicy(db, integrationId, 'calendar');
    await deleteTaskPolicy(db, integrationId, 'calendar');
    // No debe lanzar error
  });
});

test('policies map to correct integration IDs', async () => {
  await withTempDb(async (db) => {
    const integrationId1 = randomUUID();
    const integrationId2 = randomUUID();
    
    // Create integration instances first (FK requirement)
    await upsertIntegration(db, {
      id: integrationId1,
      kind: 'sonarr',
      name: 'TestSonarr1',
      url: 'http://localhost:8989',
    });
    
    await upsertIntegration(db, {
      id: integrationId2,
      kind: 'radarr',
      name: 'TestRadarr',
      url: 'http://localhost:7878',
    });

    await upsertTaskPolicy(db, {
      id: randomUUID(),
      integrationId: integrationId1,
      taskType: 'calendar',
      everyMs: 14400000,
      runOnStart: true,
      expectedDurationMs: 3000,
      failureMaxAttempts: 3,
      failureCooldownMs: 60000,
    });

    await upsertTaskPolicy(db, {
      id: randomUUID(),
      integrationId: integrationId2,
      taskType: 'calendar',
      everyMs: 7200000,
      runOnStart: false,
      expectedDurationMs: 2000,
      failureMaxAttempts: 2,
      failureCooldownMs: 30000,
    });

    const policies1 = await getAllPoliciesByIntegrationId(db, integrationId1);
    const policies2 = await getAllPoliciesByIntegrationId(db, integrationId2);

    expect(policies1.length).toBe(1, 'integrationId1 debe tener 1 política');
    expect(policies2.length).toBe(1, 'integrationId2 debe tener 1 política');
    expect(policies1[0]!.everyMs).toBe(14400000);
    expect(policies2[0]!.everyMs).toBe(7200000);
  });
});
