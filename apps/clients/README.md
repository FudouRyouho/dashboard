# Clientes

Cada carpeta es un cliente independiente del dashboard. Consumen la misma API
de `apps/server` y los mismos contratos de `packages/`.

| Cliente | Stack | Estado |
|---|---|---|
| [`react/`](react/README.md) | Vite + React 19 + Mantine 9 | mock data, sin fetch |

## Qué se comparte y qué no

- **Se comparte** lo que no es una diferencia entre frameworks: los contratos
  (`@dashboard/integrations`) y los catálogos (`@dashboard/definitions`).
- **No se comparte** la capa de datos. Cada cliente resuelve el fetching con
  lo que le sirva a su framework.

Ningún paquete de `packages/` puede depender de un cliente. Se verifica de un
vistazo en los `package.json`.
