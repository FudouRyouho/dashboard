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
import { createMemoryCacheStore } from '@dashboard/common';

export async function startServer(appConfig: Config) {
  const server = Fastify({
    logger: true,
    routerOptions: {
      maxParamLength: 5000,
    },
  });

  const cache = createMemoryCacheStore();
  const integration = createIntegrationRegistry(appConfig);

  const createContext = (_opts: CreateFastifyContextOptions): TRPCContext => ({
    integrations: integration,
    logger: server.log,
    cache,
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

  await server.listen({
    host: appConfig.server.host,
    port: appConfig.server.port,
  });

  console.log(
    `Server running at http://${appConfig.server.host}:${appConfig.server.port}`,
  );
}
