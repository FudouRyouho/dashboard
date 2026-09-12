import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerIntegration,
  getIntegrationFactory,
  getAllIntegrationFactories,
  getRegisteredKinds,
  isKindRegistered,
  type IntegrationFactory,
  type IntegrationInput,
} from './registry.js';
import { IntegrationKind } from '@dashboard/contracts';

// Helper to create a mock factory
function createMockFactory(kind: IntegrationKind): IntegrationFactory {
  return {
    metadata: {
      kind,
      defaultPort: 8080,
      displayName: `Test ${kind}`,
      description: `Test integration for ${kind}`,
      capabilities: ['calendar'],
    },
    create: (_input: IntegrationInput) => {
      return {} as any;
    },
  };
}

test('registerIntegration adds factory to registry', () => {
  const factory = createMockFactory('sonarr');
  registerIntegration(factory);
  const retrieved = getIntegrationFactory('sonarr');
  assert.ok(retrieved);
  assert.equal(retrieved!.metadata.kind, 'sonarr');
});

test('registerIntegration throws when kind already registered', () => {
  const factory1 = createMockFactory('radarr');
  registerIntegration(factory1);
  const factory2 = createMockFactory('radarr');
  assert.throws(() => registerIntegration(factory2), /already registered/);
});

test('getIntegrationFactory returns undefined for unregistered kind', () => {
  const result = getIntegrationFactory('nonexistent' as IntegrationKind);
  assert.equal(result, undefined);
});

test('getAllIntegrationFactories returns all registered factories', () => {
  const factory1 = createMockFactory('jellyfin');
  const factory2 = createMockFactory('docker');
  registerIntegration(factory1);
  registerIntegration(factory2);
  const factories = getAllIntegrationFactories();
  // Los módulos de integraciones se registran automáticamente, por lo que
  // el total incluye las factories reales más las mockeadas
  assert.ok(factories.length >= 2, `Debe haber al menos 2 factories, obtenido ${factories.length}`);
  const kinds = factories.map(f => f.metadata.kind);
  assert.ok(kinds.includes('jellyfin'));
  assert.ok(kinds.includes('docker'));
});

test('getRegisteredKinds returns all registered kinds', () => {
  const kinds = getRegisteredKinds();
  assert.ok(Array.isArray(kinds));
  assert.ok(kinds.length > 0);
});

test('isKindRegistered returns true for registered kinds', () => {
  const kinds = getRegisteredKinds();
  for (const kind of kinds) {
    assert.ok(isKindRegistered(kind));
  }
});

test('isKindRegistered returns false for unregistered kind', () => {
  assert.equal(isKindRegistered('nonexistent'), false);
});

test('isKindRegistered is a type guard', () => {
  const kind: string = 'sonarr';
  if (isKindRegistered(kind)) {
    // TypeScript should recognize this as IntegrationKind
    assert.ok(typeof kind === 'string');
  }
});
