import { vi } from 'vitest';
import type { TestIntegration } from '../core/integration';
import type { IntegrationKind } from '@dashboard/contracts';

export function createMockLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

export function createMockStore(overrides?: { get?: ReturnType<typeof vi.fn>; set?: ReturnType<typeof vi.fn> }) {
  return { get: overrides?.get ?? vi.fn().mockReturnValue(undefined), set: overrides?.set ?? vi.fn() };
}

export function createMockRunLog() {
  return { record: vi.fn(), last: vi.fn().mockReturnValue(undefined), forTask: vi.fn().mockReturnValue([]), list: vi.fn().mockReturnValue([]) };
}

export interface TestTRPCContextOverrides {
  integrations?: TestIntegration<IntegrationKind>[];
  logger?: Record<string, any>;
  store?: Record<string, any>;
  runLog?: Record<string, any>;
  db?: Record<string, any>;
}

/**
 * Returns `any` so the mock context satisfies TRPC's strict context shape without
 * requiring real Integration instances — routers only use publicIntegration and capability methods.
 */
export function createTestTRPCContext(overrides: TestTRPCContextOverrides = {}): any {
  return {
    integrations: overrides.integrations ?? [],
    logger: overrides.logger ?? createMockLogger(),
    store: overrides.store ?? createMockStore(),
    runLog: overrides.runLog ?? createMockRunLog(),
    db: overrides.db,
  };
}

export function createCallerFor<T extends Record<string, any>>(router: { createCaller: (ctx: any) => T }, ctxOverrides?: TestTRPCContextOverrides): T {
  return router.createCaller(createTestTRPCContext(ctxOverrides));
}
