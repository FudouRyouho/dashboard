import { z } from 'zod';

const integrationInputSchema = z.object({
  kind: z.enum(['sonarr', 'radarr', 'jellyfin', 'docker', 'prometheus', 'qbittorrent']),
  url: z.string().url(),
  port: z.number().int().positive().optional(),
  externalUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  secrets: z.array(z.object({ kind: z.string(), value: z.string() })).optional(),
});

const configSchema = z.object({
  server: z.object({
    host: z.string(),
    port: z.number().int().positive(),
  }),
  database: z.object({
    path: z.string().min(1),
  }),
  integrations: z.object({
    sonarr: z.object({
      url: z.string().url(),
      apiKey: z.string().optional(),
      port: z.number().int().positive().optional(),
      externalUrl: z.string().url().optional(),
    }).optional(),
    radarr: z.object({
      url: z.string().url(),
      apiKey: z.string().optional(),
      port: z.number().int().positive().optional(),
      externalUrl: z.string().url().optional(),
    }).optional(),
    jellyfin: z.object({
      url: z.string().url(),
      apiKey: z.string().optional(),
      port: z.number().int().positive().optional(),
      externalUrl: z.string().url().optional(),
    }).optional(),
    docker: z.object({
      url: z.string().url(),
      port: z.number().int().positive().optional(),
      externalUrl: z.string().url().optional(),
    }).optional(),
    qbittorrent: z.object({
      url: z.string().url(),
      apiKey: z.string().optional(),
      port: z.number().int().positive().optional(),
      externalUrl: z.string().url().optional(),
    }).optional(),
  }).optional(),
});

function parseIntegration(kind: string): z.infer<typeof integrationInputSchema> | undefined {
    const url = process.env[`${kind.toUpperCase()}_URL`];
    if (!url) return undefined;

    const apiKey = process.env[`${kind.toUpperCase()}_APIKEY`] || process.env[`${kind.toUpperCase()}_API_KEY`];
    const port = process.env[`${kind.toUpperCase()}_PORT`];
    const externalUrl = process.env[`${kind.toUpperCase()}_EXTERNAL_URL`];
    const user = process.env[`${kind.toUpperCase()}_USER`];
    const password = process.env[`${kind.toUpperCase()}_PASSWORD`];

    const secrets: { kind: string; value: string }[] = [];
    if (apiKey) secrets.push({ kind: 'apiKey', value: apiKey });
    if (user && password) {
        secrets.push({ kind: 'username', value: user });
        secrets.push({ kind: 'password', value: password });
    }

    // Validate that at least one credential is provided for qbittorrent
    if (kind === 'qbittorrent' && secrets.length === 0) {
        throw new Error(`qBittorrent integration requires either API key or username/password credentials`);
    }

    return {
        kind: kind as 'sonarr' | 'radarr' | 'jellyfin' | 'docker' | 'qbittorrent',
        url,
        port: port ? Number(port) : undefined,
        externalUrl: externalUrl || undefined,
        secrets,
    };
}

const integrations: Record<string, any> = {};
for (const kind of ['sonarr', 'radarr', 'jellyfin', 'docker', 'qbittorrent']) {
  const parsed = parseIntegration(kind);
  if (parsed) {
    integrations[kind] = parsed;
  }
}

export const config = configSchema.parse({
  server: {
    host: process.env.DASHBOARD_SERVER_HOST || '127.0.0.1',
    port: Number(process.env.DASHBOARD_SERVER_PORT || 3050),
  },
  database: {
    path: process.env.DASHBOARD_DB_PATH || './data/dashboard.sqlite',
  },
  integrations: Object.keys(integrations).length > 0 ? integrations : undefined,
});

export type Config = z.infer<typeof configSchema>;