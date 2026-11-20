# Arquitectura del monorepositorio

El servidor compone contratos compartidos, adaptadores de integración, tareas programadas y persistencia en SQLite. Algunas consultas leen instantáneas persistidas; otras llaman a servicios externos durante la solicitud. Este documento describe esos límites actuales, no una caché universal ni una propuesta de política de dependencias.

Para consultar los comandos y la configuración, véase el [README raíz](../README.md). Los detalles de las API de los paquetes corresponden a las guías enlazadas más abajo. Esta alineación abarca los seis paquetes principales; la implementación del cliente queda fuera de su alcance.

## 1. Responsabilidades y dependencias de los paquetes

La siguiente tabla recoge las dependencias del espacio de trabajo declaradas en los manifiestos de los paquetes, no un grafo completo de importaciones del código ni una regla arquitectónica. Se omiten las bibliotecas externas, las dependencias de desarrollo y las dependencias de pares.

| Paquete                                                           | Responsabilidad                                                     | Dependencias declaradas del espacio de trabajo                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| [`@dashboard/contracts`](../packages/contracts/README.md)         | Esquemas Zod, tipos y funciones auxiliares compartidas para derivar vistas de datos | Ninguna                                             |
| [`@dashboard/definitions`](../packages/definitions/README.md)     | Metadatos estáticos de integración y presentación                    | `contracts`                                      |
| [`@dashboard/db`](../packages/db/README.md)                       | Conexión SQLite, migraciones, esquemas y consultas                   | Ninguna                                             |
| [`@dashboard/integrations`](../packages/integrations/README.md)   | Adaptadores de servicios externos, fábricas y guardas de capacidad   | `common`, `contracts`                            |
| [`@dashboard/tasks`](../packages/tasks/README.md)                 | Planificador, interfaces de almacenamiento, adaptadores SQLite y tarea de retención | `db`                                             |
| [`@dashboard/testing-utils`](../packages/testing-utils/README.md) | Fábricas de prueba, datos de prueba, contextos y utilidades MSW compartidos | Ninguna; infraestructura de pruebas con dependencias de pares |

Algunos manifiestos no reflejan por completo las importaciones del código: `db` importa tipos de `contracts` sin declararlo, y `testing-utils` importa `IntegrationError` de `integrations` en tiempo de ejecución sin declarar esa dependencia del espacio de trabajo. Son omisiones de los manifiestos, no reglas deliberadas de capas de dependencias. `testing-utils` sigue siendo infraestructura de pruebas, no una capa de ejecución de la aplicación; sus funciones auxiliares son simulaciones, no sustituyen la verificación con una base de datos real.

### Composición del servidor

[`apps/server/src/server.ts`](../apps/server/src/server.ts) abre la base de datos, crea el almacén y el registro de ejecuciones respaldados por SQLite, instancia las integraciones configuradas e inicia el planificador. Fastify/tRPC expone esas dependencias mediante el contexto de la solicitud.

El paquete de tareas recibe de quien lo invoca interfaces de almacenamiento y clasificación de errores. No conoce las implementaciones de cada integración; el servidor construye las definiciones de tareas mediante guardas de capacidad. Los adaptadores de integración gestionan los protocolos externos, mientras que los contratos definen las estructuras compartidas de los resultados.

<a id="2-scheduled-data-and-sqlite-persistence"></a>

## 2. Datos programados y persistencia en SQLite

```text
External services
       ▲
       │ integration calls
Server-defined tasks ◄── Task scheduler
       │ successful payload                 │ each attempt
       ▼                                    ▼
SnapshotStore                           RunLog
       │                                    │
       └────────── SQLite adapters ──────────┘
                         ▲
                         │ database reads
                 Snapshot-backed queries
```

1. El servidor construye definiciones de tareas de calendario, lanzamientos multimedia y Docker para las integraciones compatibles.
2. El planificador ejecuta las definiciones con políticas de concurrencia y fallos. Los resultados correctos actualizan la instantánea; las tareas fallidas o abortadas no la sustituyen por datos de error.
3. `createSnapshotStoreDB` almacena un contenido JSON y una marca temporal de obtención por ID de tarea mediante las consultas de la base de datos. `createRunLogDB` persiste el historial de intentos, incluidos los resultados `success`, `failure` y `aborted`.
4. Las consultas basadas en instantáneas leen SQLite mediante estos adaptadores y combinan la instantánea con la última ejecución mediante la función auxiliar `toStatus` del servidor.

Estos **no son almacenes de instantáneas en memoria ni búferes circulares**. Los registros almacenados pueden sobrevivir a un reinicio del proceso si se reutiliza la misma base de datos. La retención es independiente: el servidor configura una tarea de purga con una ventana de 30 días que elimina tanto registros antiguos de ejecuciones como instantáneas antiguas. Conservar los datos de una ejecución correcta anterior tras un fallo no garantiza su disponibilidad indefinida.

<a id="3-current-query-and-mutation-paths"></a>

## 3. Rutas actuales de consultas y mutaciones

Una consulta no evita necesariamente la E/S externa. Las rutas actuales del servidor son:

| Procedimiento                                                                            | Fuente de datos y comportamiento                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `calendar.getEvents`                                                                 | Instantánea + última ejecución; filtra los eventos almacenados según el intervalo solicitado. No llama a la integración durante la consulta.                                                                                                              |
| `mediaReleases.getLatest`                                                            | Instantánea + última ejecución. No llama a la integración durante la consulta.                                                                                                                                                                             |
| `docker.getContainers`                                                               | **Mixta:** las estadísticas del panel y el estado usan la instantánea + última ejecución; la lista de contenedores se obtiene en directo. Se omiten las integraciones cuya operación combinada falla.                                                       |
| `docker.getContainerList`, `getContainerLogs`, `getContainerStats`, `getSystemStats` | Llamadas directas a la integración.                                                                                                                                                                                                                        |
| `downloads.getJobs`, `getAllJobs`                                                    | Llamadas directas al cliente de descargas; no hay una instantánea programada de descargas. `getAllJobs` registra los fallos y devuelve los resultados obtenidos correctamente.                                                                               |
| `systemHealth.getAllMetrics`, `getMetrics`                                           | Llamadas directas de descubrimiento y métricas a Prometheus, no instantáneas de tareas. La consulta agregada registra los fallos y no añade entradas para ellos; la consulta individual devuelve `null` si la integración no existe o no es compatible, o un arreglo de métricas vacío si falla la obtención. |

Las consultas de calendario y lanzamientos multimedia evitan la latencia de red hacia sus servicios externos durante la solicitud, pero siguen leyendo la base de datos. La consulta mixta de Docker y las rutas de consultas directas pueden incurrir en latencia de red y tienen su propia gestión de errores; no todas comparten la semántica de recurrir a una instantánea como respaldo.

Las mutaciones de descargas (`pauseQueue`, `pauseItem`, `resumeQueue`, `resumeItem`, `deleteItem`) y las de Docker (`startAll`, `stopAll`, `restartAll`, `removeAll`) llaman directamente a la integración. Estas operaciones no escriben instantáneas de tareas ni su historial de ejecuciones; una mutación correcta no actualiza por sí sola la instantánea programada.

No hay una caché compartida bajo demanda a nivel de enrutadores en estas rutas. Las descripciones anteriores que presentaban todas las lecturas como lecturas instantáneas de memoria, todos los enrutadores como basados exclusivamente en instantáneas o los puntos de acceso de Prometheus como trabajo futuro no describen la implementación actual.

## Referencias

- [Patrones de diseño](patterns.md) — convenciones de registro, persistencia, estado y capacidades.
- [Decisiones técnicas](decisions.md) — contexto de las decisiones; las notas históricas o sobre asuntos pendientes no prueban el estado actual de la implementación.
- [Guía de pruebas](TESTING.md) — convenciones de pruebas; consulte la [guía del paquete testing-utils](../packages/testing-utils/README.md) para conocer el alcance y las limitaciones actuales de sus funciones auxiliares.
