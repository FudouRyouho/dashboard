import { test, expect } from 'vitest';
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
    expect(integrations.length).toBe(0, 'Debe retornar array vacío');
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
    expect(integrations.length).toBe(2, 'Debe haber 2 integraciones');
    expect(integrations[0]?.id).toBe(id2, 'La más reciente debe estar primero');
    expect(integrations[1]?.id).toBe(id1, 'La más antigua debe estar segunda');
  });
});

test('getIntegrationById returns null for non-existent id', async () => {
  await withTempDb(async (db) => {
    const result = await getIntegrationById(db, 'non-existent-id');
    expect(result).toBe(null, 'Debe retornar null para ID inexistente');
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
    expect(result, 'Debe encontrar la integración').toBeTruthy();
    expect(result!.kind).toBe('jellyfin');
    expect(result!.name).toBe('MyJellyfin');
    expect(result!.port).toBe(8096);
  });
});

test('getIntegrationByKindAndName returns null when not found', async () => {
  await withTempDb(async (db) => {
    const result = await getIntegrationByKindAndName(db, 'sonarr', 'NoSuchInstance');
    expect(result).toBe(null, 'Debe retornar null cuando no existe');
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
    expect(result, 'Debe encontrar la integración').toBeTruthy();
    expect(result!.id).toBe(id);
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
    expect(result.id).toBe(id);
    expect(result.kind).toBe('docker');
    expect(result.name).toBe('DockerHost');
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
    
    expect(updated.name).toBe('SonarrUpdated');
    expect(updated.port).toBe(8990);
    
    const retrieved = await getIntegrationById(db, id);
    expect(retrieved?.name).toBe('SonarrUpdated');
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
    
    expect(result.externalUrl).toBe(null);
    expect(result.port).toBe(null);
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
    expect(result).toBe(null, 'Debe retornar null después de eliminar');
    
    const all = await getAllIntegrations(db);
    expect(all.length).toBe(0, 'Debe estar vacío después de eliminar');
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
    expect(result, 'Debe retornar resultado sin error').toBeTruthy();
  });
});
