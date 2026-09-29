import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from '@dashboard/testing-utils/msw';
import { http, HttpResponse } from '@dashboard/testing-utils/msw';
import { Integration } from './integration.js';

// Concrete subclass for testing
class TestIntegration extends Integration {
  constructor(url: string, port?: number) {
    super({
      kind: 'qbittorrent',
      id: 'test',
      name: 'Test',
      url,
      port,
      secrets: [],
    });
  }

  async fetchJsonWithHeaders<T>(url: URL | string, init?: RequestInit): Promise<T> {
    return this.fetchJson<T>(url, init);
  }
}

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Integration.fetchJson — Referer/Origin headers', () => {
  test('sends Referer and Origin headers matching baseUrl', async () => {
    const capturedHeaders: Record<string, string> = {};

    server.use(
      http.get('http://localhost:8080/api/v2/transfer/info', ({ request }) => {
        capturedHeaders.referer = request.headers.get('referer') ?? '';
        capturedHeaders.origin = request.headers.get('origin') ?? '';
        return HttpResponse.json({ torrents: [] });
      }),
    );

    const integration = new TestIntegration('http://localhost:8080');
    await integration.fetchJsonWithHeaders('http://localhost:8080/api/v2/transfer/info');

    expect(capturedHeaders.referer).toBe('http://localhost:8080');
    expect(capturedHeaders.origin).toBe('http://localhost:8080');
  });

  test('sends Referer and Origin headers with explicit port', async () => {
    const capturedHeaders: Record<string, string> = {};

    server.use(
      http.get('http://example.com:9091/api/v2/transfer/info', ({ request }) => {
        capturedHeaders.referer = request.headers.get('referer') ?? '';
        capturedHeaders.origin = request.headers.get('origin') ?? '';
        return HttpResponse.json({ torrents: [] });
      }),
    );

    const integration = new TestIntegration('http://example.com', 9091);
    await integration.fetchJsonWithHeaders('http://example.com:9091/api/v2/transfer/info');

    expect(capturedHeaders.referer).toBe('http://example.com:9091');
    expect(capturedHeaders.origin).toBe('http://example.com:9091');
  });

  test('preserves existing headers while adding Referer/Origin', async () => {
    const capturedHeaders: Record<string, string> = {};

    server.use(
      http.get('http://localhost:8080/api/v2/transfer/info', ({ request }) => {
        capturedHeaders.authorization = request.headers.get('authorization') ?? '';
        capturedHeaders.referer = request.headers.get('referer') ?? '';
        capturedHeaders.origin = request.headers.get('origin') ?? '';
        return HttpResponse.json({ torrents: [] });
      }),
    );

    const integration = new TestIntegration('http://localhost:8080');
    await integration.fetchJsonWithHeaders('http://localhost:8080/api/v2/transfer/info', {
      headers: { Authorization: 'Bearer test-token' },
    });

    expect(capturedHeaders.authorization).toBe('Bearer test-token');
    expect(capturedHeaders.referer).toBe('http://localhost:8080');
    expect(capturedHeaders.origin).toBe('http://localhost:8080');
  });

  test('throws IntegrationError on 403 response', async () => {
    server.use(
      http.get('http://localhost:8080/api/v2/transfer/info', () => {
        return new Response('', { status: 403 });
      }),
    );

    const integration = new TestIntegration('http://localhost:8080');
    await expect(
      integration.fetchJsonWithHeaders('http://localhost:8080/api/v2/transfer/info'),
    ).rejects.toThrow();
  });
});