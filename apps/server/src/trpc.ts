import { initTRPC } from '@trpc/server';
import type { Integration } from '@dashboard/integrations';
import { RunLog, SnapshotStore } from '@dashboard/tasks';
import { IntegrationErrorReason } from '@dashboard/contracts';
import type { DB } from '@dashboard/db';

export interface TRPCContext {
  integrations: Integration[];
  logger: AppLogger;
  store: SnapshotStore;
  runLog: RunLog<IntegrationErrorReason>;
  db: DB;
}

const t = initTRPC.context<TRPCContext>().create();

export const publicProcedure = t.procedure;
export const createTRPCRouter = t.router;

export interface AppLogger {
  info(bindings: Record<string, unknown>, message: string): void;
  warn(bindings: Record<string, unknown>, message: string): void;
  error(bindings: Record<string, unknown>, message: string): void;
}
