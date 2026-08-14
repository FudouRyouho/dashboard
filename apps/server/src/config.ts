import {z} from "zod"

const baseIntegrationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  externalUrl: z.string().url().optional(),
  timeoutMs: z.number().int().positive().default(10_000),
});

const sonarrConfigSchema = baseIntegrationSchema.extend({
  kind: z.literal("sonarr"),
  port: z.number().int().positive().default(8989),
  apiKey: z.string().min(1, "SONARR_APIKEY es obligatorio"),
});

const integrationConfigSchema = z.discriminatedUnion("kind", [
  sonarrConfigSchema,
]);

const configSchema = z.object({
    server: z.object({host: z.string(), port: z.number()}),
    integrations: z.array(integrationConfigSchema),
})



export const config = configSchema.parse({
    server: {
        host: process.env.DASHBOARD_SERVER_HOST || "127.0.0.1",
        port: Number(process.env.DASHBOARD_SERVER_PORT || 3000),
    },
    integrations: {
        sonarr: [
            {
                kind: "sonarr",
                id: "sonarr",
                name: "Sonarr",
                url: process.env.SERVER_2_URL || "http://192.168.10.197",
                port: 8989,
                apiKey: process.env.SONARR_APIKEY ?? "No API Key provided",
            }
        ]
    }
}
)

export type Config = z.infer<typeof configSchema>;
