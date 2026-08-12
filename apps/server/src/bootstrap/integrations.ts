import { SonarrIntegration } from "@dashboard/integrations";
import { config } from "../config";
import type { IntegrationRegistry } from "../trpc";

export const integrationRegistry: IntegrationRegistry = {
    sonarr: config.integrations.sonarr.map(
        (integration) => new SonarrIntegration({
            kind: integration.kind,
            id: integration.id,
            name: integration.name,
            url: integration.url,
            port: integration.port,
            decryptedSecrets: [
                {
                    kind: "apiKey",
                    value: integration.apiKey
                }
            ]
        })
    )
}