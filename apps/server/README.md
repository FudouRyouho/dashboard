# @dashboard/server

API tRPC sobre Fastify. Expone las integraciones normalizadas de
`@dashboard/integrations` a los clientes de `apps/clients/`.

## Arranque

Necesita `apps/server/.env` (copiar de `.env.example`):

| Variable                | Para qué                              |
| ----------------------- | ------------------------------------- |
| `DASHBOARD_SERVER_HOST` | host de Fastify (default `127.0.0.1`) |
| `DASHBOARD_SERVER_PORT` | puerto (default `3050`)               |
| `DASHBOARD_DB_PATH`     | ruta de la base de datos SQLite       |

    pnpm --filter @dashboard/server dev     # tsx watch
    pnpm --filter @dashboard/server smoke   # smoke test del contrato

## Endpoints

- `GET /health` — Fastify plano, sin tRPC
- `/trpc/*` — router tRPC:
  - `health` — query sin input, returns `{ status: 'ok' }`
  - `calendar.getEvents` — query, input `{ start: date, end: date }`, returns events in range
  - `mediaReleases.getLatest` — query, no input, returns latest releases per integration
  - `integrations.list` — query, no input, returns all integrations
  - `integrations.get` — query, input `{ id: string }`, returns one integration
  - `integrations.upsert` — mutation, input `{ kind, ...fields }`, creates or updates
  - `integrations.delete` — mutation, input `{ id: string }`, deletes an integration
  - `policies.listByIntegration` — query, input `{ integrationId: string }`, returns all task policies
  - `policies.get` — query, input `{ integrationId, taskType }`, returns one policy
  - `policies.upsert` — mutation, input policy fields, creates or updates a task policy
  - `policies.delete` — mutation, input `{ integrationId, taskType }`, deletes a task policy
  - `downloads.getAllJobs` — query, input `{ limit? }`, returns jobs from all download-client integrations
  - `downloads.getJobs` — query, input `{ integrationId, limit? }`, returns jobs for one integration
  - `downloads.pauseQueue` — mutation, input `{ integrationId }`, pauses all downloads
  - `downloads.pauseItem` — mutation, input `{ integrationId, torrentHash, fromDisk? }`, pauses one torrent
  - `downloads.resumeQueue` — mutation, input `{ integrationId }`, resumes all downloads
  - `downloads.resumeItem` — mutation, input `{ integrationId, torrentHash, fromDisk? }`, resumes one torrent
  - `downloads.deleteItem` — mutation, input `{ integrationId, torrentHash, fromDisk? }`, deletes one torrent
  - `systemHealth.getAllMetrics` — query, no input, returns metrics from all system-health integrations
  - `systemHealth.getMetrics` — query, input `{ server: string }`, returns metrics for one server
  - `docker.getContainers` — query, no input, returns container stats per Docker integration
  - `docker.startAll` — mutation, input `{ ids: string[] }`, starts containers
  - `docker.stopAll` — mutation, input `{ ids: string[] }`, stops containers
  - `docker.restartAll` — mutation, input `{ ids: string[] }`, restarts containers
  - `docker.removeAll` — mutation, input `{ ids: string[] }`, removes containers
- `/icons/*` — servicio de íconos estáticos, sirve archivos SVG desde `packages/definitions/icons/`

## Conexión remota (sin cliente)

    curl -sG http://127.0.0.1:3050/trpc/calendar.getEvents \
      --data-urlencode 'input={"start":"2026-08-01T00:00:00.000Z","end":"2026-08-31T00:00:00.000Z"}' \
      | jq '.result.data'

El input usa `z.coerce.date()` para aceptar strings ISO sin envoltorio
superjson. Si alguna vez cambia a `z.date()`, habría que enviar fechas
`Date` reales o el `meta.values` correspondiente.
