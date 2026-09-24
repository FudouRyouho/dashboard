import { http, HttpResponse } from 'msw';
import type { IntegrationKind } from '@dashboard/contracts';

interface SonarrHandlerConfig {
  kind: IntegrationKind; id: string; url: string; port: number; apiKey?: string;
  responses?: { calendar?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty'; series?: 'success' | 'error_401' | 'error_500' | 'empty'; };
}

export const sonarrHandlers = (config: SonarrHandlerConfig) => {
  const baseUrl = `${config.url.replace(/\/$/, '')}:${config.port}`;
  return [
    http.get(`${baseUrl}/api/v3/calendar`, ({ request }) => {
      const key = request.headers.get('X-Api-Key');
      if (config.apiKey && key !== config.apiKey) return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const m = config.responses?.calendar ?? 'success';
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'malformed') return new Response('{"invalid":', { status: 200, headers: { 'content-type': 'application/json' } });
      if (m === 'empty') return HttpResponse.json([]);
      return HttpResponse.json([{ id: 1, title: 'Test Episode', series: { id: 1, title: 'Test Series', titleSlug: 'test-series', overview: 'Overview' }, airDateUtc: new Date().toISOString(), seasonNumber: 1, episodeNumber: 1, images: [] }]);
    }),
    http.get(`${baseUrl}/api/v3/series`, () => {
      const m = config.responses?.series ?? 'success';
      if (m === 'error_401') return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      return HttpResponse.json([{ id: 1, title: 'Test Series', titleSlug: 'test-series', year: 2024 }]);
    }),
  ];
};
