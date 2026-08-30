# @dashboard/integrations

Una clase por servicio externo, cada una se comunica con su propia 'integracion' retornando el contrato de `@dashboard/contracts`, ya alidado.

## Estructura

- `base/integration.ts` — clase abstracta: URLs, secretos, timeout, `fetchJson`
- `base/calendar.ts` — la capacidad `ICalendarIntegration` y su type guard
- `base/integration-error.ts` — `IntegrationError` y `classifyIntegrationError`
- `image.ts` — elección de imagen por tipo de cover y sus aspect ratios
- `sonarr/`, `radarr/` — la integración y el schema Zod de su respuesta

## Agregar una integración

1. `kind` nuevo en `@dashboard/contracts/kinds.ts`
2. nombre e ícono en `@dashboard/definitions` (el typecheck te lo va a pedir)
3. schema Zod de la respuesta cruda en `<kind>/schemas/`
4. la clase, extendiendo `Integration` e implementando las capacidades
5. el `case` en `apps/server/src/bootstrap/integrations.ts`

> [!NOTE]
> **URL interna vs. externa.** `baseUrl` es a dónde se le pega `externalUrl` es el link que se le muestra al usuario. `publicIntegration` expone la externa, nunca la interna.
> **La validación Zod.** `parse()` sobre la respuesta cruda antes de mapear: si Sonarr cambia un campo, el error es `invalid-response`, no un `undefined` viajando hasta la UI.
