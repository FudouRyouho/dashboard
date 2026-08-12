export interface IntegrationConfig {
    kind: string;
    id: string;
    name: string;
    url: string;
    port?: number;
    apiKey: string;
}

export const config = {
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

