import { http, HttpResponse } from 'msw';
import type { IntegrationKind } from '@dashboard/contracts';

interface RadarrHandlerConfig {
  kind: IntegrationKind; id: string; url: string; port: number; apiKey?: string;
  responses?: { movies?: 'success' | 'error_401' | 'error_500' | 'empty'; calendar?: 'success' | 'error_401' | 'error_500' | 'empty'; };
}

export const radarrHandlers = (config: RadarrHandlerConfig) => {
  const baseUrl = `${config.url.replace(/\/$/, '')}:${config.port}`;
  return [
    http.get(`${baseUrl}/api/v3/movie`, ({ request }) => {
      const key = request.headers.get('X-Api-Key');
      if (config.apiKey && key !== config.apiKey) return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const m = config.responses?.movies ?? 'success';
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'empty') return HttpResponse.json([]);
      return HttpResponse.json([{ id: 1, title: 'Test Movie', titleSlug: 'test-movie', year: 2024 }]);
    }),
    http.get(`${baseUrl}/api/v3/calendar`, ({ request }) => {
      const key = request.headers.get('X-Api-Key');
      if (config.apiKey && key !== config.apiKey) return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const m = config.responses?.calendar ?? 'success';
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'empty') return HttpResponse.json([]);
      return HttpResponse.json([{ movie: { id: 1, title: 'Test Movie' }, date: new Date().toISOString(), types: ['grabbed'] }]);
    }),
  ];
};
