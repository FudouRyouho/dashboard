import { beforeEach, describe, expect, it } from 'vitest';

import { fetchDownloads, fetchHealth } from './client';

/**
 * The client is plain fetch over /trpc, so the URL it builds is the contract.
 * Every case here asserts the exact request line: a wrong query string is what
 * made `downloads.getAllJobs` return 400 while every happy-path test passed.
 */
const calls: string[] = [];
let nextData: unknown = null;

beforeEach(() => {
  calls.length = 0;
  const mockFetch: typeof fetch = async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(JSON.stringify({ result: { data: nextData } }));
  };
  globalThis.fetch = mockFetch;
});

describe('downloads.getAllJobs', () => {
  it('sends an explicit empty object so the server defaults still apply', async () => {
    nextData = [];

    await fetchDownloads();

    expect(calls).toEqual(['/trpc/downloads.getAllJobs?input=%7B%7D']);
  });
});

describe('procedures without input', () => {
  it('omits the query string instead of sending a bare "?"', async () => {
    nextData = { status: 'ok' };

    await fetchHealth();

    expect(calls).toEqual(['/trpc/health']);
  });
});
