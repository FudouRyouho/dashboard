import { http, HttpResponse } from 'msw';
import type { IntegrationKind } from '@dashboard/contracts';

interface QBittorrentHandlerConfig {
  kind: IntegrationKind; id: string; url: string; port: number;
  username?: string; password?: string;
  responses?: { torrents?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty'; appVersion?: 'success' | 'error_401' | 'error_500'; };
}

export const qbittorrentHandlers = (config: QBittorrentHandlerConfig) => {
  const baseUrl = `${config.url.replace(/\/$/, '')}:${config.port}`;
  return [
    http.get(`${baseUrl}/api/v2/app/version`, ({ request }) => {
      const cookie = request.headers.get('cookie') ?? '';
      if (!cookie.includes('SID=')) return new Response('', { status: 403 });
      const m = config.responses?.appVersion ?? 'success';
      if (m === 'error_401') return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      return new Response('4.4.0', { status: 200, headers: { 'content-type': 'text/plain' } });
    }),
    http.post(`${baseUrl}/api/v2/auth/login`, async ({ request }) => {
      const body = await request.text();
      const params = new URLSearchParams(body);
      if (params.get('username') === config.username && params.get('password') === config.password) {
        return new Response('Ok.', { status: 200, headers: { 'Set-Cookie': `SID=test-sid; Path=/; HttpOnly` } });
      }
      return new Response('Forbidden.', { status: 403, headers: { 'Set-Cookie': 'SID=; Path=/; HttpOnly' } });
    }),
    http.get(`${baseUrl}/api/v2/torrents/info`, ({ request }) => {
      const cookie = request.headers.get('cookie') ?? '';
      if (!cookie.includes('SID=')) return new Response('', { status: 403 });
      const m = config.responses?.torrents ?? 'success';
      if (m === 'error_401') return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'malformed') return new Response('{"invalid":', { status: 200, headers: { 'content-type': 'application/json' } });
      if (m === 'empty') return HttpResponse.json([]);
      return HttpResponse.json([{ hash: 'test-hash', name: 'Test Torrent', size: 1000000, progress: 0.5, dlspeed: 1024, upspeed: 512, state: 'downloading', category: 'test', added_on: Math.floor(Date.now() / 1000) - 3600, eta: 1800, uploaded: 100, completion_on: 0, total_size: 1000000 }]);
    }),
    http.post(`${baseUrl}/api/v2/torrents/pause`, () => new Response('', { status: 200 })),
    http.post(`${baseUrl}/api/v2/torrents/resume`, () => new Response('', { status: 200 })),
    http.post(`${baseUrl}/api/v2/torrents/delete`, () => new Response('', { status: 200 })),
  ];
};
