# @dashboard/definitions

Catálogos del dominio (kind → nombre, ícono). Lo consumen `integrations` y los clientes.

## Estructura

- `src/external-service.ts` — definición de servicios externos (kind, nombre, color, ícono)
- `src/integration.ts` — tipo `IntegrationKind` y mapa de kinds a nombres + íconos
- `src/index.ts` — reexporta todo lo anterior

## Íconos

Los íconos son archivos `.svg` en `icons/` (fuente única). El servidor los sirve estáticamente en `/icons/{name}.svg` vía `@fastify/static`.
