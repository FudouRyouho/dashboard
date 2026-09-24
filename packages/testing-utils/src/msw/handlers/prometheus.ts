import { http, HttpResponse } from 'msw';

interface PrometheusHandlerConfig {
  id: string; url: string; port: number;
  responses?: { query?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty'; labelValues?: 'success' | 'error_500' | 'empty'; };
}

export const prometheusHandlers = (config: PrometheusHandlerConfig) => {
  const baseUrl = `${config.url.replace(/\/$/, '')}:${config.port}`;
  return [
    http.get(`${baseUrl}/api/v1/query`, () => {
      const m = config.responses?.query ?? 'success';
      if (m === 'error_401') return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'malformed') return new Response('{"invalid":', { status: 200 });
      if (m === 'empty') return HttpResponse.json({ status: 'success', data: { resultType: 'vector', result: [] } });
      return HttpResponse.json({ status: 'success', data: { resultType: 'vector', result: [{ metric: { instance: config.id }, value: [Date.now() / 1000, '0.5'] }] } });
    }),
    http.get(`${baseUrl}/api/v1/label/__name__/values`, () => {
      const m = config.responses?.labelValues ?? 'success';
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'empty') return HttpResponse.json({ status: 'success', data: [] });
      return HttpResponse.json({ status: 'success', data: ['up', 'cpu_usage', 'memory_usage'] });
    }),
  ];
};
