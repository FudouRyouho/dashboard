import { z } from 'zod';

const failurePolicySchema = z
  .object({
    maxAttempts: z.number().int().positive(),
    cooldownMs: z.number().int().positive(),
  })
  .partial();

const taskPolicySchema = z.object({
  everyMs: z.number().int().positive().optional(),
  runOnStart: z.boolean().optional(),
  expectedDurationMs: z.number().int().positive().optional(),
  failurePolicy: failurePolicySchema.optional(),
});

const connectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  externalUrl: z.string().url().optional(),
  timeoutMs: z.number().int().positive().default(10_000),
});

const baseIntegrationSchema = connectionSchema.extend({
  tasks: z.record(taskPolicySchema).default({}),
});

const sonarrConfigSchema = baseIntegrationSchema.extend({
  kind: z.literal('sonarr'),
  port: z.number().int().positive().default(8989),
  apiKey: z.string().min(1, 'SONARR_APIKEY es obligatorio'),
});

const radarrConfigSchema = baseIntegrationSchema.extend({
  kind: z.literal('radarr'),
  port: z.number().int().positive().default(7878),
  apiKey: z.string().min(1, 'RADARR_APIKEY es obligatorio'),
});

const jellyfinConfigSchema = baseIntegrationSchema.extend({
  kind: z.literal('jellyfin'),
  port: z.number().int().positive().default(8096),
  apiKey: z.string().min(1, 'JELLYFIN_APIKEY es obligatorio'),
});

const integrationConfigSchema = z.discriminatedUnion('kind', [
  sonarrConfigSchema,
  radarrConfigSchema,
  jellyfinConfigSchema,
]);

const configSchema = z.object({
  server: z.object({ host: z.string(), port: z.number() }),
  integrations: z.array(integrationConfigSchema).superRefine((list, ctx) => {
    const seen = new Set<string>();
    list.forEach((integration, index) => {
      if (!seen.has(integration.id)) {
        seen.add(integration.id);
        return;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'id'],
        message:
          `El id "${integration.id}" está repetido. El id es la clave de ` +
          `los timers, del contador de fallos y del almacén: dos ` +
          `integraciones con el mismo id se pisan en silencio.`,
      });
    });
  }),
});

export const config = configSchema.parse({
  server: {
    host: process.env.DASHBOARD_SERVER_HOST || '127.0.0.1',
    port: Number(process.env.DASHBOARD_SERVER_PORT || 3050),
  },
  integrations: [
    {
      kind: 'sonarr',
      id: 'sonarr',
      name: 'Sonarr',
      url: process.env.SERVER_2_URL || 'http://192.168.10.197',
      port: 8989,
      apiKey: process.env.SONARR_APIKEY,
    },
    {
      kind: 'radarr',
      id: 'radarr',
      name: 'radarr',
      url: process.env.SERVER_2_URL || 'http://192.168.10.197',
      port: 7878,
      apiKey: process.env.RADARR_APIKEY,
    },
    {
      kind: 'jellyfin',
      id: 'jellyfin',
      name: 'Jellyfin',
      url: process.env.SERVER_1_URL || 'http://192.168.10.125',
      port: 8096,
      apiKey: process.env.JELLYFIN_APIKEY || '',
    },
  ],
});

export type Config = z.infer<typeof configSchema>;
