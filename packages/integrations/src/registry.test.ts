import { test, expect } from 'vitest';
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
  expect(retrieved).toBeTruthy();
  expect(retrieved!.metadata.kind).toBe('sonarr');
});

test('registerIntegration throws when kind already registered', () => {
  const factory1 = createMockFactory('radarr');
  registerIntegration(factory1);
  const factory2 = createMockFactory('radarr');
  expect(() => registerIntegration(factory2)).toThrow(/already registered/);
});

test('getIntegrationFactory returns undefined for unregistered kind', () => {
  const result = getIntegrationFactory('nonexistent' as IntegrationKind);
  expect(result).toBe(undefined);
});

test('getAllIntegrationFactories returns all registered factories', () => {
  const factory1 = createMockFactory('jellyfin');
  const factory2 = createMockFactory('docker');
  registerIntegration(factory1);
  registerIntegration(factory2);
  const factories = getAllIntegrationFactories();
  // Los módulos de integraciones se registran automáticamente, por lo que
  // el total incluye las factories reales más las mockeadas
  expect(factories.length >= 2, `Debe haber al menos 2 factories, obtenido ${factories.length}`).toBeTruthy();
  const kinds = factories.map(f => f.metadata.kind);
  expect(kinds.includes('jellyfin')).toBeTruthy();
  expect(kinds.includes('docker')).toBeTruthy();
});

test('getRegisteredKinds returns all registered kinds', () => {
  const kinds = getRegisteredKinds();
  expect(Array.isArray(kinds)).toBeTruthy();
  expect(kinds.length > 0).toBeTruthy();
});

test('isKindRegistered returns true for registered kinds', () => {
  const kinds = getRegisteredKinds();
  for (const kind of kinds) {
    expect(isKindRegistered(kind)).toBeTruthy();
  }
});

test('isKindRegistered returns false for unregistered kind', () => {
  expect(isKindRegistered('nonexistent')).toBe(false);
});

test('isKindRegistered is a type guard', () => {
  const kind: string = 'sonarr';
  if (isKindRegistered(kind)) {
    // TypeScript should recognize this as IntegrationKind
    expect(typeof kind === 'string').toBeTruthy();
  }
});
