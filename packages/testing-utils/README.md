# `@dashboard/testing-utils`

Datos de prueba, factorías y manejadores HTTP compartidos para el monorepositorio del panel. Este paquete es infraestructura de pruebas; no es una dependencia de ejecución de la aplicación del panel.

## Superficie de importación

El paquete exporta subrutas específicas:

| Importación                          | Contenido                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `@dashboard/testing-utils/core`      | Tipos y funciones auxiliares de integraciones de prueba y contextos tRPC, sin factorías basadas en Vitest     |
| `@dashboard/testing-utils/factories` | Simulaciones de integraciones, tRPC y bases de datos basadas en Vitest                                        |
| `@dashboard/testing-utils/fixtures`  | Errores habituales de integración y datos de prueba de respuestas HTTP                                        |
| `@dashboard/testing-utils/msw`       | Manejadores de MSW y utilidades de servidor para Sonarr, Radarr, Jellyfin, Docker, qBittorrent y Prometheus     |

El punto de entrada raíz `@dashboard/testing-utils` reexporta las cuatro áreas, incluida MSW. Prefiere una subruta específica cuando una prueba solo necesite un área; no presupongas que el punto de entrada raíz excluye MSW de su grafo de importaciones.

## Funciones auxiliares habituales

- `createTestTRPCContext(overrides?)` proporciona una lista de integraciones vacía y simulaciones del registrador, el almacén de instantáneas y el registro de ejecuciones. El contexto de base de datos toma el valor `undefined` de forma predeterminada; proporciona `db` explícitamente cuando un procedimiento lo necesite.
- `createCallerFor(router, overrides?)` crea un cliente tipado de llamadas tRPC sin realizar una solicitud HTTP.
- `createMockStore()` devuelve `undefined` en las lecturas de forma predeterminada y proporciona espías de Vitest para lecturas y escrituras. Pasa implementaciones alternativas de `get` o `set` para controlar un caso de prueba.
- `createMockRunLog()` proporciona un historial vacío de forma predeterminada y espías para registrar y consultar ejecuciones.
- `createMockDb()` proporciona espías superficiales para métodos habituales de base de datos. No implementa cadenas arbitrarias de consultas de Drizzle; configura los métodos que utiliza el código bajo prueba o usa una prueba con base de datos cuando el comportamiento de las consultas sea relevante.
- Las factorías de integraciones proporcionan integraciones de prueba con valores predeterminados que se pueden sobrescribir. Los datos de prueba de respuestas y errores, y los manejadores de MSW, cubren respuestas habituales de éxito y fallo.

Estas funciones auxiliares son deliberadamente simulaciones, no réplicas de la base de datos ni de las integraciones de producción. Mantén las aserciones en el límite del procedimiento público o de la integración y añade únicamente el comportamiento que la prueba necesite modelar.

## Comprobaciones del paquete

El paquete expone `pnpm --filter @dashboard/testing-utils typecheck`. La suite completa de pruebas unitarias se ejecuta desde la raíz del espacio de trabajo con `pnpm test`.
