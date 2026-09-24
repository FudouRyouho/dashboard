import { http, HttpResponse } from 'msw';
import type { IntegrationKind } from '@dashboard/contracts';

interface JellyfinHandlerConfig {
  kind: IntegrationKind; id: string; url: string; port: number; apiKey?: string;
  responses?: { items?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty'; };
}

export const jellyfinHandlers = (config: JellyfinHandlerConfig) => {
  const baseUrl = `${config.url.replace(/\/$/, '')}:${config.port}`;
  return [
    http.get(`${baseUrl}/Users/${config.id}/Items`, ({ request }) => {
      const key = request.headers.get('X-Emby-Token') ?? request.headers.get('Authorization');
      if (config.apiKey && key !== config.apiKey) return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const m = config.responses?.items ?? 'success';
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'malformed') return new Response('{"invalid":', { status: 200, headers: { 'content-type': 'application/json' } });
      if (m === 'empty') return HttpResponse.json({ Items: [], TotalRecordCount: 0 });
      return HttpResponse.json({ Items: [{ Name: 'Test Series', Id: 'test-series-1', Type: 'Series', MediaType: 'Video', DateCreated: new Date().toISOString(), Overview: 'Test overview' }], TotalRecordCount: 1 });
    }),
  ];
};
