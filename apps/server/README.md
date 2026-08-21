# @dashboard/server

API tRPC sobre Fastify. Expone las integraciones normalizadas de
`@dashboard/integrations` a los clientes de `apps/clients/`.

## Arranque

Necesita `apps/server/.env` (copiar de `.env.example`):

| Variable | Para qué |
|---|---|
| `DASHBOARD_SERVER_HOST` | host de Fastify (default `127.0.0.1`) |
| `DASHBOARD_SERVER_PORT` | puerto (default `3000`) |
| `SERVER_2_URL` | URL base de la máquina con Sonarr |
| `SONARR_APIKEY` | Settings → General en Sonarr |

    pnpm --filter @dashboard/server dev     # tsx watch
    pnpm --filter @dashboard/server smoke   # smoke test del contrato

## Endpoints

- `GET /health` — Fastify plano, sin tRPC
- `/trpc/*` — router tRPC: `health`, `calendar.getEvents`

## Pegarle sin cliente

    curl -sG http://127.0.0.1:3000/trpc/calendar.getEvents \
      --data-urlencode 'input={"json":{"start":"2026-08-01T00:00:00.000Z","end":"2026-08-31T00:00:00.000Z"}}' \
      | jq '.result.data.json'

Funciona sin el bloque `meta` de superjson porque el input usa
`z.coerce.date()`: acepta el string ISO y lo convierte. Si alguna vez pasa a
`z.date()`, hay que mandar `meta.values` a mano.
