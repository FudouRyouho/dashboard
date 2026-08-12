import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { SonarrIntegration } from "@dashboard/integrations";
export interface IntegrationRegistry {
  sonarr: SonarrIntegration[];
}

export interface TRPCContext {
  integrations: IntegrationRegistry;
  logger: AppLogger;
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export interface AppLogger {
  warn(
    bindings: Record<string, unknown>,
    message: string,
  ): void;
}