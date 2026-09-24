import type { IntegrationKind } from '@dashboard/contracts';
import type { TestIntegration } from './integration';
import type { TestDb } from './database';

/**
 * Pure TypeScript interfaces — zero runtime dependencies.
 */

export interface MockLogger {
  info: (bindings: Record<string, unknown>, message: string) => void;
  warn: (bindings: Record<string, unknown>, message: string) => void;
  error: (bindings: Record<string, unknown>, message: string) => void;
}

export interface MockStore {
  get: <T>(key: { taskId: string }) => { data: T; obtainedAt: Date } | undefined;
  set: <T>(key: { taskId: string }, data: T) => void;
}

export interface MockRunLog {
  record: (run: { taskId: string; startedAt: Date; durationMs: number; outcome: 'success' | 'failure' | 'aborted'; cause?: string; detail?: unknown }) => void;
  last: (taskId: string) => { taskId: string; startedAt: Date; durationMs: number; outcome: 'success' | 'failure' | 'aborted'; cause?: string; detail?: unknown } | undefined;
  forTask: (taskId: string) => Array<{ taskId: string; startedAt: Date; durationMs: number; outcome: 'success' | 'failure' | 'aborted'; cause?: string; detail?: unknown }>;
  list: (taskId: string, range: { from: Date; to: Date }) => Array<{ taskId: string; startedAt: Date; durationMs: number; outcome: 'success' | 'failure' | 'aborted'; cause?: string; detail?: unknown }>;
}

export interface TestTRPCContext {
  integrations: TestIntegration<IntegrationKind>[];
  logger: MockLogger;
  store: MockStore;
  runLog: MockRunLog;
  db: TestDb;
}