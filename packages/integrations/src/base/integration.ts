import { removeTrailingSlash } from "@dashboard/common";

export interface IntegrationInput {
    kind: string;
    id: string;
    name: string;
    url: string;
    port?: number;
    decryptedSecrets: { kind: string, value: string }[];
}

export abstract class Integration {
    constructor(protected integration: IntegrationInput) { }

    public get publicIntegration() {
        return {
            kind: this.integration.kind,
            id: this.integration.id,
            name: this.integration.name,
            url: this.url("/").replace(/\/$/, ""),
        };
    }

    protected getSecretValue(kind: string) {
        const secret = this.integration.decryptedSecrets.find((secret) => secret.kind === kind);
        if (!secret) {
            throw new Error(`No secret of kind ${kind} was found`)
        }
        return secret.value;
    }

    protected hasSecretValue(kind: string) {
        return this.integration.decryptedSecrets.some((secret) => secret.kind === kind);
    }

    protected createUrl(
        inputUrl: string,
        path: `/${string}`,
        port?: number,
        queryParams?: Record<string, string | Date | number | boolean | null | undefined>,
    ) {
        const base = removeTrailingSlash(inputUrl ?? this.integration.url);
        const urlWithPort = port ? `${base}:${port}` : base;
        const url = new URL(urlWithPort + path);

        if (queryParams) {
            Object.entries(queryParams).forEach(([key, value]) => {
                if (value === null || value === undefined) return;
                const valueString = value instanceof Date ? value.toISOString() : String(value);
                url.searchParams.set(key, valueString);
            });
        }
        return url.toString();
    }

    protected url(path: `/${string}`, queryParams?: Record<string, string | Date | number | boolean | null | undefined>) {
        return this.createUrl(this.integration.url, path, this.integration.port, queryParams);
    }

    protected async fetchJson<T = unknown>(url: string | URL, init?: RequestInit): Promise<T> {
        const res = await fetch(String(url), init);
        if (!res.ok) {
            throw new Error(
                `Integration request failed with HTTP ${res.status} ${res.statusText}`,
            );
        }
        return (await res.json()) as T;
    }
}