# @dashboard/definitions

Catálogos del dominio (kind → nombre, ícono). Lo consumen `integrations` y los clientes.
Generación de assets a partir de `.svg` como data `URIs` embed en un `.ts` local sin dependencia del bundler o de una CDN.

## Estructura

- `src/external-service.ts` — definición de servicios externos (kind, nombre, etc.)
- `src/icons.generated.ts` — iconos generados para la UI (kind -> icon) como data URIs
- `src/integration.ts` — tipo `IntegrationKind` y mapa de kinds a nombres
- `src/index.ts` — reexporta todo lo anterior

## Generación de iconos

Los iconos se generan a partir de archivos SVG en `assets/icons/` mediante el script `scripts/build-icons.ts`.
Este script toma cada SVG, lo convierte en una data URI y crea un mapa de kind a URI en `icons.generated.ts`.

Para regenerar los iconos:

```bash
pnpm --filter @dashboard/definitions build:icons
```