import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Integration } from '@dashboard/integrations';
import { RunLog, SnapshotStore } from '@dashboard/tasks';
import { IntegrationErrorReason } from '@dashboard/contracts';

export interface TRPCContext {
  integrations: Integration[];
  logger: AppLogger;
  store: SnapshotStore;
  runLog: RunLog<IntegrationErrorReason>;
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;
export const createTRPCRouter = t.router;

export interface AppLogger {
  warn(bindings: Record<string, unknown>, message: string): void;
}
