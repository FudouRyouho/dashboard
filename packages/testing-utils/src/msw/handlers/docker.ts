import { http, HttpResponse } from 'msw';


interface DockerHandlerConfig {
  id: string; url: string; port: number;
  responses?: { containers?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty'; volumes?: 'success' | 'error_500' | 'empty'; networks?: 'success' | 'error_500' | 'empty'; };
}

export const dockerHandlers = (config: DockerHandlerConfig) => {
  const baseUrl = `${config.url.replace(/\/$/, '')}:${config.port}`;
  return [
    http.get(`${baseUrl}/containers/json`, () => {
      const m = config.responses?.containers ?? 'success';
      if (m === 'error_401') return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'malformed') return new Response('{"invalid":', { status: 200, headers: { 'content-type': 'application/json' } });
      if (m === 'empty') return HttpResponse.json([]);
      return HttpResponse.json([{ Id: 'test-container-1', Names: ['/test'], Image: 'nginx:latest', State: 'running', Status: 'Up 1h', Health: { Status: 'healthy' }, HostConfig: { NetworkMode: 'bridge' }, Labels: {}, Ports: [], Mounts: [] }]);
    }),
    http.get(`${baseUrl}/volumes/json`, () => {
      const m = config.responses?.volumes ?? 'success';
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'empty') return HttpResponse.json({ Volumes: [], Warnings: null });
      return HttpResponse.json({ Volumes: [{ Name: 'test-vol', Driver: 'local', Mountpoint: '/var/lib/docker/volumes/test-vol/_data', CreatedAt: new Date().toISOString(), Labels: {}, Scope: 'local', Options: null }], Warnings: null });
    }),
    http.get(`${baseUrl}/networks/json`, () => {
      const m = config.responses?.networks ?? 'success';
      if (m === 'error_500') return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      if (m === 'empty') return HttpResponse.json([]);
      return HttpResponse.json([{ Name: 'bridge', Id: 'test-net-id', Created: new Date().toISOString(), Scope: 'local', Driver: 'bridge', EnableIPv4: true, IPAM: { Driver: 'default', Config: [{ Subnet: '172.17.0.0/16', Gateway: '172.17.0.1' }] }, Internal: false, Ingress: false, ConfigOnly: false, Labels: {}, Options: {} }]);
    }),
    http.post(`${baseUrl}/containers/${'{{id}}'}/start`, () => new Response('', { status: 204 })),
    http.post(`${baseUrl}/containers/${'{{id}}'}/stop`, () => new Response('', { status: 204 })),
    http.post(`${baseUrl}/containers/${'{{id}}'}/restart`, () => new Response('', { status: 204 })),
    http.delete(`${baseUrl}/containers/${'{{id}}'}`, () => new Response('', { status: 204 })),
  ];
};
