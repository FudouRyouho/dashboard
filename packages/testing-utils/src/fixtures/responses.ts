export const responseFixtures = {
  ok: <T>(body: T) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }),
  created: <T>(body: T) => new Response(JSON.stringify(body), { status: 201, headers: { 'content-type': 'application/json' } }),
  noContent: () => new Response(null, { status: 204 }),
  emptyArray: () => new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
  unauthorized: (body: unknown = { error: 'Unauthorized' }) => new Response(JSON.stringify(body), { status: 401 }),
  forbidden: (body: unknown = { error: 'Forbidden' }) => new Response(JSON.stringify(body), { status: 403 }),
  notFound: (body: unknown = { error: 'Not Found' }) => new Response(JSON.stringify(body), { status: 404 }),
  serverError: (body: unknown = { error: 'Internal Server Error' }) => new Response(JSON.stringify(body), { status: 500 }),
  serviceUnavailable: (body: unknown = { error: 'Service Unavailable' }) => new Response(JSON.stringify(body), { status: 503 }),
  malformedJson: (body = '{"invalid":') => new Response(body, { status: 200, headers: { 'content-type': 'application/json' } }),
};
