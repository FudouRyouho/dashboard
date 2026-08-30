import Fastify from 'fastify';
import {
  fastifyTRPCPlugin,
  type CreateFastifyContextOptions,
  type FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import { appRouter, type AppRouter } from './index';
import type { TRPCContext } from './trpc';
import { createIntegrationRegistry } from './bootstrap/integrations';
import type { Config } from './config';
import {
  createMemoryStore,
  createRunLog,
  createScheduler,
} from '@dashboard/tasks';
import { IntegrationErrorReason } from '@dashboard/contracts';
import { createTaskDefinitions } from './tasks/create-task-definitions';
import { classifyIntegrationError } from '@dashboard/integrations';

export async function startServer(appConfig: Config) {
  const server = Fastify({
    logger: true,
    routerOptions: {
      maxParamLength: 5000,
    },
  });

  const store = createMemoryStore();
  const runLog = createRunLog<IntegrationErrorReason>(60);

  const registry = createIntegrationRegistry(appConfig);
  const tasks = createTaskDefinitions(registry);

  const integrations = registry.map((entry) => entry.integration);
  const scheduler = createScheduler<IntegrationErrorReason>(tasks, {
    store,
    runLog,
    concurrency: 4,
    classify: (err: unknown) => {
      const result = classifyIntegrationError(err);
      return {
        cause: result.reason,
        detail:
          result.httpStatus === undefined
            ? undefined
            : { httpStatus: result.httpStatus },
      };
    },
    now: () => new Date(),
    onSlow: (run, expectedMs) =>
      server.log.warn(
        { taskId: run.taskId, durationMs: run.durationMs, expectedMs },
        'Tarea lenta',
      ),
  });

  const createContext = (_opts: CreateFastifyContextOptions): TRPCContext => ({
    integrations: integrations,
    logger: server.log,
    store,
    runLog,
  });

  server.get('/health', () => ({
    status: 'ok',
  }));

  server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, type, error }) {
        server.log.error(
          {
            path,
            type,
            error,
          },
          'tRPC request failed',
        );
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
  });

  server.addHook('onClose', () => scheduler.stop());

  await server.listen({
    host: appConfig.server.host,
    port: appConfig.server.port,
  });

  console.log(
    `Server running at http://${appConfig.server.host}:${appConfig.server.port}`,
  );
}
