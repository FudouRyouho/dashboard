import { removeTrailingSlash } from '@dashboard/common';

export interface IntegrationInput {
  kind: string;
  id: string;
  name: string;
  url: string;
  port?: number;
  externalUrl?: string;
  secrets: { kind: string; value: string }[];
  timeoutMs?: number;
}

type QueryParams = Record<
  string,
  Date | boolean | number | string | null | undefined
>;

export abstract class Integration {
  protected readonly baseUrl: string;
  protected readonly externalBaseUrl: string;
  protected readonly timeoutMs: number;

  constructor(protected integration: IntegrationInput) {
    const base = removeTrailingSlash(integration.url);
    this.baseUrl = integration.port ? `${base}:${integration.port}` : base;
    this.externalBaseUrl = integration.externalUrl
      ? removeTrailingSlash(integration.externalUrl)
      : this.baseUrl;
    this.timeoutMs = integration.timeoutMs ?? 10_000;
  }

  public get publicIntegration() {
    return {
      kind: this.integration.kind,
      id: this.integration.id,
      name: this.integration.name,
      url: this.externalBaseUrl,
    };
  }

  protected getSecretValue(kind: string) {
    const secret = this.integration.secrets.find(
      (secret) => secret.kind === kind,
    );
    if (!secret) {
      throw new Error(`No secret of kind ${kind} was found`);
    }
    return secret.value;
  }

  protected hasSecretValue(kind: string) {
    return this.integration.secrets.some((secret) => secret.kind === kind);
  }

  protected url(path: `/${string}`, queryParams?: QueryParams) {
    return this.createUrl(this.baseUrl, path, queryParams);
  }

  protected externalUrl(path: `/${string}`, queryParams?: QueryParams) {
    return this.createUrl(this.externalBaseUrl, path, queryParams);
  }

  protected async fetchJson<T = unknown>(
    url: URL | string,
    init?: RequestInit,
  ): Promise<T> {
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const res = await fetch(String(url), {
      ...init,
      signal: init?.signal
        ? AbortSignal.any([init.signal, timeoutSignal])
        : timeoutSignal,
    });
    if (!res.ok) {
      throw new Error(
        `Integration request failed with HTTP ${res.status} ${res.statusText}`,
      );
    }
    return (await res.json()) as T;
  }

  private createUrl(
    baseUrl: string,
    path: `/${string}`,
    queryParams?: QueryParams,
  ) {
    const url = new URL(baseUrl + path);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        url.searchParams.set(
          key,
          value instanceof Date ? value.toISOString() : String(value),
        );
      });
    }
    return url.toString();
  }
}
