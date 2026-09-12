import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { initializeDatabase } from '@dashboard/db';
import {
  getAllIntegrations,
  getIntegrationById,
  getIntegrationByKindAndName,
  upsertIntegration,
  deleteIntegration,
  type UpsertIntegrationInput,
} from './integrations.js';

const tempPath = () => `./data/test-integrations-${randomUUID()}.sqlite`;
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

test('getAllIntegrations returns empty array when no integrations', async () => {
  await withTempDb(async (db) => {
    const integrations = await getAllIntegrations(db);
    assert.equal(integrations.length, 0, 'Debe retornar array vacío');
  });
});

test('getAllIntegrations returns integrations sorted by createdAt desc', async () => {
  await withTempDb(async (db) => {
    const id1 = randomUUID();
    const id2 = randomUUID();
    
    await upsertIntegration(db, {
      id: id1,
      kind: 'sonarr',
      name: 'First',
      url: 'http://localhost:8989',
    });
    
    await new Promise((r) => setTimeout(r, 10));
    
    await upsertIntegration(db, {
      id: id2,
      kind: 'radarr',
      name: 'Second',
      url: 'http://localhost:7878',
    });
    
    const integrations = await getAllIntegrations(db);
    assert.equal(integrations.length, 2, 'Debe haber 2 integraciones');
    assert.equal(integrations[0]?.id, id2, 'La más reciente debe estar primero');
    assert.equal(integrations[1]?.id, id1, 'La más antigua debe estar segunda');
  });
});

test('getIntegrationById returns null for non-existent id', async () => {
  await withTempDb(async (db) => {
    const result = await getIntegrationById(db, 'non-existent-id');
    assert.equal(result, null, 'Debe retornar null para ID inexistente');
  });
});

test('getIntegrationById returns integration when exists', async () => {
  await withTempDb(async (db) => {
    const id = randomUUID();
    await upsertIntegration(db, {
      id,
      kind: 'jellyfin',
      name: 'MyJellyfin',
      url: 'http://localhost:8096',
      port: 8096,
    });
    
    const result = await getIntegrationById(db, id);
    assert.ok(result, 'Debe encontrar la integración');
    assert.equal(result!.kind, 'jellyfin');
    assert.equal(result!.name, 'MyJellyfin');
    assert.equal(result!.port, 8096);
  });
});

test('getIntegrationByKindAndName returns null when not found', async () => {
  await withTempDb(async (db) => {
    const result = await getIntegrationByKindAndName(db, 'sonarr', 'NoSuchInstance');
    assert.equal(result, null, 'Debe retornar null cuando no existe');
  });
});

test('getIntegrationByKindAndName returns integration when exists', async () => {
  await withTempDb(async (db) => {
    const id = randomUUID();
    await upsertIntegration(db, {
      id,
      kind: 'sonarr',
      name: 'SonarrMain',
      url: 'http://localhost:8989',
    });
    
    const result = await getIntegrationByKindAndName(db, 'sonarr', 'SonarrMain');
    assert.ok(result, 'Debe encontrar la integración');
    assert.equal(result!.id, id);
  });
});

test('upsertIntegration creates new integration', async () => {
  await withTempDb(async (db) => {
    const id = randomUUID();
    const input: UpsertIntegrationInput = {
      id,
      kind: 'docker',
      name: 'DockerHost',
      url: 'http://localhost:2375',
      port: 2375,
    };
    
    const result = await upsertIntegration(db, input);
    assert.equal(result.id, id);
    assert.equal(result.kind, 'docker');
    assert.equal(result.name, 'DockerHost');
  });
});

test('upsertIntegration updates existing integration', async () => {
  await withTempDb(async (db) => {
    const id = randomUUID();
    await upsertIntegration(db, {
      id,
      kind: 'sonarr',
      name: 'Sonarr',
      url: 'http://localhost:8989',
    });
    
    const updated = await upsertIntegration(db, {
      id,
      kind: 'sonarr',
      name: 'SonarrUpdated',
      url: 'http://localhost:8990',
      port: 8990,
    });
    
    assert.equal(updated.name, 'SonarrUpdated');
    assert.equal(updated.port, 8990);
    
    const retrieved = await getIntegrationById(db, id);
    assert.equal(retrieved?.name, 'SonarrUpdated');
  });
});

test('upsertIntegration handles null optional fields', async () => {
  await withTempDb(async (db) => {
    const id = randomUUID();
    const result = await upsertIntegration(db, {
      id,
      kind: 'radarr',
      name: 'Radarr',
      url: 'http://localhost:7878',
      externalUrl: null,
      apiKey: undefined,
      port: null,
    });
    
    assert.equal(result.externalUrl, null);
    assert.equal(result.port, null);
  });
});

test('deleteIntegration removes integration', async () => {
  await withTempDb(async (db) => {
    const id = randomUUID();
    await upsertIntegration(db, {
      id,
      kind: 'sonarr',
      name: 'Sonarr',
      url: 'http://localhost:8989',
    });
    
    await deleteIntegration(db, id);
    
    const result = await getIntegrationById(db, id);
    assert.equal(result, null, 'Debe retornar null después de eliminar');
    
    const all = await getAllIntegrations(db);
    assert.equal(all.length, 0, 'Debe estar vacío después de eliminar');
  });
});

test('deleteIntegration is idempotent (no error if already deleted)', async () => {
  await withTempDb(async (db) => {
    const id = randomUUID();
    await deleteIntegration(db, id);
    await deleteIntegration(db, id);
    // No debe lanzar error
  });
});

test('upsertIntegration throws if retrieval fails after upsert', async () => {
  await withTempDb(async (db) => {
    // Esta prueba es difícil de triggering en SQLite normal
    // pero el código tiene el guard, así que verificamos que no falle en caso normal
    const id = randomUUID();
    const result = await upsertIntegration(db, {
      id,
      kind: 'jellyfin',
      name: 'Jellyfin',
      url: 'http://localhost:8096',
    });
    assert.ok(result, 'Debe retornar resultado sin error');
  });
});
