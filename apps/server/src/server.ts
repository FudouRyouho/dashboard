import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  fastifyTRPCPlugin,
  type CreateFastifyContextOptions,
  type FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import { appRouter, type AppRouter } from './index';
import type { TRPCContext } from './trpc';
import { createIntegrationRegistry } from './bootstrap/integrations';
import { createDatabase } from './bootstrap/db';
import type { Config } from './config';
import {
  createRunLogDB,
  createSnapshotStoreDB,
  createScheduler,
} from '@dashboard/tasks';
import { IntegrationErrorReason } from '@dashboard/contracts';
import { createTaskDefinitions } from './tasks/create-task-definitions';
import { createPurgeTask } from '@dashboard/tasks';
import { classifyIntegrationError } from '@dashboard/integrations';
import { getAllPoliciesByIntegrationId } from '@dashboard/db';

const definitionsRoot = dirname(fileURLToPath(import.meta.resolve('@dashboard/definitions')));
const iconsDir = join(definitionsRoot, '..', 'icons');

export async function startServer(appConfig: Config) {
  const server = Fastify({
    logger: true,
    routerOptions: {
      maxParamLength: 5000,
    },
  });

  await server.register(fastifyStatic, {
    root: iconsDir,
    prefix: '/icons',
    decorateReply: false,
  });

  const db = await createDatabase();
  const store = createSnapshotStoreDB(db);
  const runLog = createRunLogDB<IntegrationErrorReason>(db);

  const registry = await createIntegrationRegistry(db);

  // Build policies map for task definitions
  const policiesMap = new Map<string, { calendar?: any; mediaReleases?: any }>();
  for (const entry of registry) {
    const policies = await getAllPoliciesByIntegrationId(db, entry.row.id);
    const taskPolicies: { calendar?: any; mediaReleases?: any } = {};
    for (const policy of policies) {
      if (policy.taskType === 'calendar') {
        taskPolicies.calendar = {
          everyMs: policy.everyMs,
          runOnStart: policy.runOnStart,
          expectedDurationMs: policy.expectedDurationMs,
          failurePolicy: {
            maxAttempts: policy.failureMaxAttempts,
            cooldownMs: policy.failureCooldownMs,
          },
        };
      } else if (policy.taskType === 'mediaReleases') {
        taskPolicies.mediaReleases = {
          everyMs: policy.everyMs,
          runOnStart: policy.runOnStart,
          expectedDurationMs: policy.expectedDurationMs,
          failurePolicy: {
            maxAttempts: policy.failureMaxAttempts,
            cooldownMs: policy.failureCooldownMs,
          },
        };
      }
    }
    policiesMap.set(entry.row.id, taskPolicies);
  }

  const tasks = createTaskDefinitions(registry, policiesMap);
  const purgeTask = createPurgeTask({ db, daysToKeep: 30, logger: server.log });

  const integrations = registry.map((entry) => entry.integration);
  const scheduler = createScheduler<IntegrationErrorReason>(
    [...tasks, purgeTask],
    {
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
      onSuccess: (run) =>
        server.log.info(
          { taskId: run.taskId, durationMs: run.durationMs },
          'Tarea completada',
        ),
      onSlow: (run, expectedMs) =>
        server.log.warn(
          { taskId: run.taskId, durationMs: run.durationMs, expectedMs },
          'Tarea lenta',
        ),
    },
  );

  const createContext = (_opts: CreateFastifyContextOptions): TRPCContext => ({
    integrations: integrations,
    logger: server.log,
    store,
    runLog,
    db,
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