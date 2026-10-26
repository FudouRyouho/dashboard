# @dashboard/client-react

Cliente web del dashboard. Vite 8 + React 19 + Mantine 9.

    pnpm --filter @dashboard/client-react dev
    pnpm --filter @dashboard/client-react typecheck
    pnpm --filter @dashboard/client-react lint

## Estado

UI sobre **mock data**:

  - calendar.mock.ts
  - docker.mock.ts
  - downloads.mock.ts
  - integrations.mock.ts  (shape = integrationOutputSchema, 7 kinds, sin status/secrets)
  - media-releases.mock.ts (shape = {integration, status, releases}[])
  - system-health.mock.ts  (con name/status/lastScrapeTime del normalizer)

## Estructura

- `shell/` — layout: header, tabs, cambio de tema
- `sections/` — una carpeta por sección del dashboard; cada una exporta solo `XxxBase` como puerta de entrada
  - `calendar/` — `CalendarBase`, `CalendarDay`, `CalendarEventList`, `calendar-colors.ts`
  - `docker/` — `DockerSectionBase`, `DockerContainerTable`, `DockerContainerRow`, `DockerContainerContextMenu`, `DockerStatsBar`, `docker-colors.ts`, `docker-format.ts`, `types.ts`
  - `downloads/` — `DownloadsSectionBase`, `DownloadTable`, `TorrentRow`, `TorrentNameCell`, `DownloadContextMenu`, `StatsBar`, `FooterBar`, `StateFilter`, `downloads-colors.ts`, `format.ts`
  - `integrations/` — `IntegrationsBase`, `IntegrationCard`, `IntegrationEditModal`, `useIntegrationsState.ts`
  - `media-releases/` — `MediaReleasesBase`, `MediaReleaseItem`, `media-releases-colors.ts`, `OverflowBadge`, `types.ts`
  - `system-health/` — `SystemHealthBase`, `CpuMemoryRings`, `MetricRing`, `DiskUsageList`, `NetworkInterfacesList`, `SensorList`, `NetworkSummaryBar`, `health-colors.ts`, `format.ts`
- `mock/` — datos de prueba, tipados contra `@dashboard/integrations`
- `theme.ts` — tema de Mantine

## Lo que no es obvio

- **`tsconfig.json` está aislado del de la raíz.** El `typecheck` de la raíz
  excluye `apps/clients/**`; este paquete corre el suyo. El `"exclude": []`
  no es cosmético: sin él hereda el exclude de la raíz y se excluye a sí mismo.
- **`import type` vs import normal.** Un `import type` se borra al compilar y
  Vite nunca lo ve. Si importás un _valor_ de un paquete del workspace, tiene
  que estar en `dependencies` o Vite no lo resuelve en runtime.
- **Fechas.** `renderDay` de `@mantine/dates` entrega `"YYYY-MM-DD"` (string,
  no `Date`), y `new Date("YYYY-MM-DD")` parsea como **UTC**, no local. Es el
  origen de los bugs de "un día corrido" que ya aparecieron dos veces acá.
