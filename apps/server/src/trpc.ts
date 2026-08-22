import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Integration } from '@dashboard/integrations';
import { CacheStore } from '@dashboard/common';

export interface TRPCContext {
  integrations: IntegrationRegistry;
  logger: AppLogger;
  cache: CacheStore;
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export interface AppLogger {
  warn(bindings: Record<string, unknown>, message: string): void;
}

export type IntegrationRegistry = Integration[];
