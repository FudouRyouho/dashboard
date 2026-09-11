import { z } from 'zod';

const configSchema = z.object({
  server: z.object({ host: z.string(), port: z.number() }),
});

export const config = configSchema.parse({
  server: {
    host: process.env.DASHBOARD_SERVER_HOST || '127.0.0.1',
    port: Number(process.env.DASHBOARD_SERVER_PORT || 3050),
  },
});

export type Config = z.infer<typeof configSchema>;
