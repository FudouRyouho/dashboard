import Fastify from "fastify";
import {
  fastifyTRPCPlugin,
  type CreateFastifyContextOptions,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { appRouter, type AppRouter } from "./index";
import type { TRPCContext } from "./trpc";
import { createIntegrationRegistry } from "./bootstrap/integrations";
import { Config } from "./config";

export async function startServer(appConfig: Config) {
  const server = Fastify({
    logger: true,
    routerOptions: {
      maxParamLength: 5000,
    },
  });

  const createContext = (
  _opts: CreateFastifyContextOptions,
): TRPCContext => ({
  integrations: createIntegrationRegistry(appConfig),
  logger: server.log,
});

  server.get("/health", async () => ({
    status: "ok",
  }));

  server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
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
          "tRPC request failed",
        );
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
  });

  await server.listen({
    host: appConfig.server.host,
    port: appConfig.server.port,
  });

  console.log(
    `Server running at http://${appConfig.server.host}:${appConfig.server.port}`,
  );
}