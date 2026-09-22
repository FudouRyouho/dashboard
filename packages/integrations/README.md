# @dashboard/integrations

Una clase por servicio externo, cada una se comunica con su propia 'integracion' retornando el contrato de `@dashboard/contracts`, ya alidado.

## Estructura

- `base/integration.ts` — clase abstracta: URLs, secretos, timeout, `fetchJson`
- `base/calendar.ts` — la capacidad `ICalendarIntegration` y su type guard
- `base/media-releases.ts` — la capacidad `IMediaReleasesIntegration` y su type guard
- `base/download-client.ts` — la capacidad `IDownloadClientIntegration` y su type guard
- `base/system-health.ts` — la capacidad `ISystemHealthIntegration` y su type guard
- `base/docker.ts` — la capacidad `IDockerIntegration` y su type guard
- `base/integration-error.ts` — `IntegrationError` y `classifyIntegrationError`
- `image.ts` — elección de imagen por tipo de cover y sus aspect ratios
- `sonarr/`, `radarr/` — la integración y el schema Zod de su respuesta
- `jellyfin/` — integración Jellyfin, schemas Zod en `schemas/`
- `prometheus/` — integración Prometheus (métricas del sistema), schemas Zod en `schemas/`
- `download-client/` — integración qBittorrent, schemas Zod en `schemas/`
- `docker/` — integración nativa Docker Engine API (puerto 2375), schemas Zod en `schemas/`

## Agregar una integración

1. `kind` nuevo en `@dashboard/contracts/kinds.ts`
2. nombre e ícono en `@dashboard/definitions` (el typecheck te lo va a pedir)
3. schema Zod de la respuesta cruda en `<kind>/schemas/`
4. la clase, extendiendo `Integration` e implementando las capacidades
5. el `registerIntegration()` en el `registration.ts` de la integración (auto-registro via registry pattern)

> [!NOTE]
> **URL interna vs. externa.** `baseUrl` es a dónde se le pega `externalUrl` es el link que se le muestra al usuario. `publicIntegration` expone la externa, nunca la interna.
> **La validación Zod.** `parse()` sobre la respuesta cruda antes de mapear: si Sonarr cambia un campo, el error es `invalid-response`, no un `undefined` viajando hasta la UI.
> **Configuración.** El schema de configuración (`apps/server/src/config.ts`) requiere agregar el `*ConfigSchema` al discriminated union para cada nueva integración.
